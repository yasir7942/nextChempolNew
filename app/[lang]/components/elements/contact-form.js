'use client';
import { useState } from 'react';
import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const ContactForm = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptchaCode, setIsCaptchaCode] = useState('');
  const recaptchaRef = React.createRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CONTACT_API_KEY}`,
        },
        body: JSON.stringify({ fullName, phoneNumber, email, country, message, isCaptchaCode }),
      });




      if (response.ok) {
        setStatus('Email sent successfully!');
        // Reset form fields only on success
        setFullName('');
        setPhoneNumber('');
        setEmail('');
        setCountry('');
        setMessage('');
        setIsCaptchaCode('');
        recaptchaRef.current.reset(); // Reset the reCAPTCHA
      } else {
        const result = await response.json();
        setStatus('Failed to send email: System Error Email Us');
      }
    } catch (error) {
      console.error(error);
      //setStatus('Failed to send email: System Error Email Us');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onReCAPTCHAChange = (captchaCode) => {
    if (!captchaCode) return;
    setIsCaptchaCode(captchaCode);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex mb-4">
          <div className="w-1/2 mr-2">
            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="name">Name</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              placeholder="Your name"
              required
            />
          </div>
          <div className="w-1/2 ml-2">
            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="phoneNumber">Phone</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Valid phone number"
              required
            />
          </div>
        </div>

        <div className="flex mb-4">
          <div className="w-1/2 mr-2">
            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="email">Email</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
            />
          </div>
          <div className="w-1/2 ml-2">
            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="country">Country</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
              id="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Your country"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="message">Message</label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
            id="message"
            rows="4"
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          ></textarea>
          <small className="error text-gray-500 font-light">Please avoid including hyperlinks or URLs in your message.</small>
        </div>

        <div className="mb-4">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={onReCAPTCHAChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            disabled={isSubmitting}
            className="font-medium text-lg border border-spacing-1 border-white bg-textBlue hover:bg-textLightBlue transition duration-150 text-white hover:text-gray-800 py-2 px-12 focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Send
          </button>

          {/* Spinner next to the button */}
          {isSubmitting && (
            <div className="ml-3 animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
          )}
        </div>

        {status && <p className="pt-5 text-[#A81B1A]">{status}</p>}
      </form>
    </div>
  );
};

export default ContactForm;
