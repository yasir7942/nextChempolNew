export const EmailTemplate = ({
  name,
  phone,
  mail,
  contry,
  msg
}) => (
  <div>
    <div className="content">
      <h2 className="text-xl font-semibold">Contact Details</h2>
      <p><strong>Full Name:</strong> {name}</p>
      <p><strong>Phone Number:</strong> {phone}</p>
      <p><strong>Email:</strong> {mail}</p>
      <p><strong>Country:</strong> {contry}</p>
      <p><strong>Message:</strong></p>
      <p>{msg}</p>
    </div>
    <div className="footer">
      <p className="text-sm">This email is sent from Chempol contact form.</p>
    </div>
  </div>
);
