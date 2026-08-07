import { agentToolDeclarations, executeAgentTool } from './rag/agentTools.js';
import { hybridRAGQuery } from './rag/hybridSearch.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[RAG Agent Endpoint] Incoming query: "${message}"`);

    // 1. Initial Hybrid RAG search to pull relevant knowledge automatically
    const ragContextDocs = await hybridRAGQuery(message, 3);
    const contextSnippet = ragContextDocs
      .map((d) => `• [${d.title}]: ${d.content}`)
      .join('\n');

    // 2. Determine Intent & Tool Actions
    let toolResult = null;
    let actionTaken = null;

    const lower = message.toLowerCase();

    if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('slot')) {
      if (lower.includes('book') && (lower.includes('am') || lower.includes('pm') || lower.includes('at'))) {
        actionTaken = 'book_appointment';
        toolResult = await executeAgentTool('book_appointment', {
          patientName: 'Patient',
          doctorName: 'Specialist Consultant',
          date: new Date().toISOString().split('T')[0],
          time: '11:00 AM',
          symptoms: message
        });
      } else {
        actionTaken = 'check_doctor_availability';
        toolResult = await executeAgentTool('check_doctor_availability', {
          doctorNameOrSpecialty: 'General Consultant',
          date: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      actionTaken = 'search_clinic_knowledge';
      toolResult = {
        success: true,
        source: 'Hybrid RAG (Vector + BM25 RRF)',
        documents: ragContextDocs
      };
    }

    // 3. Synthesize Agent Response
    let agentReply = '';

    if (actionTaken === 'book_appointment' && toolResult?.appointment) {
      const apt = toolResult.appointment;
      agentReply = `✅ **Appointment Booked Successfully!**\n\n• **Doctor:** ${apt.doctorName}\n• **Date:** ${apt.date}\n• **Time:** ${apt.time}\n• **Status:** ${apt.status.toUpperCase()}\n\n*Reference ID:* \`${apt.patientId}\``;
    } else if (actionTaken === 'check_doctor_availability' && toolResult?.availableSlots) {
      agentReply = `🏥 **Available Slots for ${toolResult.doctorOrSpecialty} on ${toolResult.date}:**\n\n${toolResult.availableSlots.map((s) => `⏰ ${s}`).join('\n')}\n\nWould you like me to reserve one of these slots for you?`;
    } else {
      agentReply = `Medi AI Assistant (Hybrid RAG):\n\n${ragContextDocs.map((d) => `📌 **${d.title}**\n${d.content}`).join('\n\n')}`;
    }

    return res.status(200).json({
      success: true,
      reply: agentReply,
      actionTaken,
      toolResult,
      ragDocs: ragContextDocs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error in rag-agent:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
}
