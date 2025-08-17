import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

function generateTempPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let pwd = ''
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pwd
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body || {}
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const tempPassword = generateTempPassword(14)

    // Generate a recovery link so the user can optionally reset on their own too
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: process.env.APP_BASE_URL
          ? `${process.env.APP_BASE_URL}/login`
          : undefined,
      },
    })

    // Update user password if user is known
    if (linkData?.user?.id) {
      await supabase.auth.admin.updateUserById(linkData.user.id, {
        password: tempPassword,
      })
    }

    // Email the user the temporary password (and recovery link if available)
    const from = process.env.SENDGRID_FROM || 'noreply@nestbase.io'
    const msg = {
      to: email,
      from,
      subject: 'Your NestBase temporary password',
      html: `
        <p>We received a request to reset your password.</p>
        <p><strong>Temporary password:</strong> ${tempPassword}</p>
        <p>You can sign in with this password, then change it in your account settings.</p>
        ${linkData?.action_link ? `<p>Or reset via this link: <a href="${linkData.action_link}">Reset Password</a></p>` : ''}
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }

    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('forgot-password error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}


