import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, first_name, user_id } = req.body;
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM || 'noreply@nestbase.io',
    templateId: 'd-2779cc0fb09c47b9a5c8b853a14e0baa',
    dynamic_template_data: {
      first_name: first_name
    },
  };

  try {
    await sgMail.send(msg);
    // Optionally update the profile to mark email as sent (if you want, using Supabase client)
    // await supabase.from('profiles').update({ welcome_email_sent: true }).eq('id', user_id);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    res.status(500).json({ error: error.response?.body || error.message });
  }
} 