// This file lives in: /api/sendSlackNotification.js

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fullName, formTitle, createdAt, fileUrl } = req.body;

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  const messageBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🎯 *New Form Submission Received!*`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Name:*\n${fullName || 'Unknown'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Form:*\n${formTitle}`,
        },
        {
          type: 'mrkdwn',
          text: `*Submitted:*\n${new Date(createdAt).toLocaleString()}`,
        },
        ...(fileUrl
          ? [
              {
                type: 'mrkdwn',
                text: `*File:*\n<${fileUrl}|View File>`,
              },
            ]
          : []),
      ],
    },
  ];

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: messageBlocks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ message: 'Slack error', error: errorText });
    }

    return res.status(200).json({ message: 'Slack notification sent' });
  } catch (error) {
    console.error('Slack webhook failed:', error);
    return res.status(500).json({ message: 'Slack error', error: error.message });
  }
};
