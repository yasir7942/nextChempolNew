import { EmailTemplate } from '@/app/components/elements/email-template';
import fetch from "node-fetch";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {

    console.log("Request..................")
    // console.log(request)

    // Check for API key in headers
    const apiKey = request.headers.get('Authorization') + '7JtBCBL777KkUJp';

    if (apiKey !== `Bearer ${process.env.CONTACT_API_KEY}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    console.log("........Pass Auth local.................")
    const { fullName, phoneNumber, email, country, message, isCaptchaCode } = await request.json();



    // Validate input data
    if (!fullName || !phoneNumber || !email || !country || !message || !isCaptchaCode) {
        return new Response(JSON.stringify({ error: 'Invalid input or Missing Values' }), { status: 400 });
    }

    console.log("........Pass data Empty Data validation................")


    // Regular expression to detect URLs
    const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|href\s*=\s*["'][^\s]+["']/i;

    // Regular expression to validate email addresses
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Function to validate email addresses
    const isValidEmail = email => emailPattern.test(email);


    // Function to check for URLs
    const containsUrl = message => urlPattern.test(message);

    // List of spammy or unwanted words
    const spamWords = ['crypto', 'win prize', 'free money', 'investment', 'click here', 'grils', 'girl', 'https', 'http', 'href'];

    // Function to check for spammy words
    const containsSpam = message => spamWords.some(word => message.toLowerCase().includes(word.toLowerCase()));

    if (!isValidEmail(email)) {  // Check if the email is valid
        return new Response(JSON.stringify({ error: 'Invalid email address.' }), { status: 400 });
    }


    console.log("........Pass Email validation................")

    if (containsUrl(message)) {  // Check if the message contains a URL
        console.log("Message contains a URL, which is not allowed");
        return new Response(JSON.stringify({ error: 'Message contains a URL, which is not allowed.' }), { status: 400 });
    }

    console.log("........Pass Message URL validation................")

    if (containsSpam(message)) {  // Check if the message contains spammy words
        console.log("Message contains spammy or unwanted words.");
        return new Response(JSON.stringify({ error: 'Message contains spammy or unwanted words.' }), { status: 400 });
    }

    console.log("........Pass Message SPAM WORD validation................")



    try {

        //Captcha validation
        const response = await fetch(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${isCaptchaCode}`,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
                },
                method: "POST",
            }
        );
        const captchaValidation = await response.json();



        if (captchaValidation.success && process.env.NEXT_PUBLIC_SITE == captchaValidation.hostname) {


            console.log("........Pass MGoogle Captcha validation................")


            const { data, error } = await resend.emails.send({
                from: 'Chempol Site <website@chempol.co.uk>',
                to: ['info@chempol.co.uk'],
                subject: 'Chempol Contact Form - ' + fullName,
                react: EmailTemplate({
                    name: fullName,
                    phone: phoneNumber,
                    mail: email,
                    contry: country,
                    msg: message
                })
            });

            if (error) {
                console.log("Send API Error");
                return Response.json({ error }, { status: 500 });
            }

            return new Response(JSON.stringify({ message: 'Email sent successfully!' }), { status: 200 });
        }


        return new Response(JSON.stringify({ message: 'Error In Google Captcha!' }), { status: 500 });



    } catch (error) {
        console.log("api error 2");
        console.log(error);
        return Response.json({ error }, { status: 500 });
    }
}
