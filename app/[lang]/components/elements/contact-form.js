'use client';
import { useState } from 'react';
import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { MdCheckCircle } from 'react-icons/md';
import { trackFormSubmission } from '@/libs/track';
import { newSubmissionKey } from '@/libs/submission-key';

// Same limits as app/api/send/route.js
const MAX_LENGTH = { fullName: 100, phoneNumber: 30, email: 254, country: 100, message: 5000 };

// Error `code` from app/api/send → dictionary key of the message shown
const ERROR_MESSAGES = {
  captcha: 'captchaRequired',
  rate_limit: 'tooManyRequests',
  too_long: 'tooLong',
  invalid_email: 'invalidEmail',
  url: 'notice',
};

const ContactForm = ({ locale, dictionary }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(''); // error message
  const [sent, setSent] = useState(false); // shows the thank-you panel instead of the form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptchaCode, setIsCaptchaCode] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: hidden, only bots fill it in
  const recaptchaRef = React.useRef(null);
  // one ID per filled-in form, so a double submit is stored once (libs/submission-key.js)
  const [submissionKey, setSubmissionKey] = useState(newSubmissionKey);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isCaptchaCode) {
      setStatus(dictionary.contactPage.captchaRequired);
      return;
    }

    setIsSubmitting(true);
    setStatus('');

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phoneNumber, email, country, message, isCaptchaCode, website, locale, clientSubmissionId: submissionKey }),
      });

      if (response.ok) {
        setSent(true);
        trackFormSubmission('contact');
        setSubmissionKey(newSubmissionKey());
        // Reset form fields only on success
        setFullName('');
        setPhoneNumber('');
        setEmail('');
        setCountry('');
        setMessage('');
      } else {
        const result = await response.json().catch(() => ({}));
        setStatus(dictionary.contactPage[ERROR_MESSAGES[result.code]] || dictionary.contactPage.failSend);
      }
    } catch (error) {
      console.error(error);
      setStatus(dictionary.contactPage.failSend);
    } finally {
      // a reCAPTCHA answer works once: ask for a new one after every attempt
      setIsCaptchaCode('');
      recaptchaRef.current?.reset();
      setIsSubmitting(false);
    }
  };

  // null when the answer expires
  const onReCAPTCHAChange = (captchaCode) => {
    setIsCaptchaCode(captchaCode || '');
  };

  if (sent) {
    return (
      <div role="status" className="py-10 text-center">
        <MdCheckCircle aria-hidden="true" className="mx-auto text-6xl text-green-600" />
        <p className="mt-3 text-lg font-semibold text-green-700">{dictionary.contactPage.successTitle}</p>
        <p className="mt-2 font-light text-gray-700">{dictionary.contactPage.successText}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 py-2 px-10 bg-textBlue text-white font-medium hover:bg-textLightBlue hover:text-gray-900 transition-colors"
        >
          {dictionary.contactPage.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* honeypot: off screen and skipped by keyboard and screen readers, so only bots fill it in */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className="flex mb-4">
          <div className="w-1/2 mr-2">
            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="name">{dictionary.contactPage.yourName}</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={MAX_LENGTH.fullName}
              type="text"
              placeholder={dictionary.contactPage.yourName}
              required
            />
          </div>
          <div className="w-1/2 ml-2">
            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="phoneNumber">{dictionary.contactPage.phonelable} <small className="font-light text-gray-500">({dictionary.contactPage.countryCodeHint})</small></label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={MAX_LENGTH.phoneNumber}
              placeholder={dictionary.contactPage.phone}
              required
            />
          </div>
        </div>

        <div className="flex mb-4">
          <div className="w-1/2 mr-2">
            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="email">{dictionary.contactPage.emailLable}</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={MAX_LENGTH.email}
              placeholder={dictionary.contactPage.email}
              required
            />
          </div>
          <div className="w-1/2 ml-2">
            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="country">{dictionary.contactPage.countryLable}</label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
              id="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              maxLength={MAX_LENGTH.country}
              placeholder={dictionary.contactPage.country}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="message">{dictionary.contactPage.messageLable}</label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 tracking-wide text-gray-800 bg-transparent font-light leading-tight focus:outline-none focus:shadow-outline"
            id="message"
            rows="4"
            placeholder={dictionary.contactPage.message}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_LENGTH.message}
            required
          ></textarea>
          <small className="error text-gray-500 font-light">{dictionary.contactPage.notice}</small>
        </div>

        <div className="mb-4">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={onReCAPTCHAChange}
            hl={locale}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            disabled={isSubmitting}
            className="font-medium text-lg border border-spacing-1 border-white bg-textBlue hover:bg-textLightBlue transition duration-150 text-white hover:text-gray-800 py-2 px-12 focus:outline-none focus:shadow-outline"
            type="submit"
          >
            {dictionary.contactPage.send}
          </button>

          {/* Spinner next to the button */}
          {isSubmitting && (
            <div className="ml-3 animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
          )}
        </div>

        {status && (
          <p role="alert" className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-[#A81B1A]">{status}</p>
        )}
      </form>
    </div>
  );
};

export default ContactForm;
