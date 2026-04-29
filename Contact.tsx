import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Contact Us</h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Get in touch for support, feedback, or inquiries.</p>
      </div>

      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Contact Info Cards */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/50 flex-shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">Email</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">support@clvpredictor.ai</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/50 flex-shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">Phone</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/50 flex-shrink-0">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">Address</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">123 AI Boulevard, Tech City</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="space-y-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <div className="ml-3">
                  <p className="text-xs sm:text-sm text-slate-900 dark:text-white">Business Hours</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mon-Fri: 9AM - 6PM EST</p>
                </div>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <div className="ml-3">
                  <p className="text-xs sm:text-sm text-slate-900 dark:text-white">Response Time</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Within 24 hours</p>
                </div>
              </div>
              <div className="flex items-center">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <div className="ml-3">
                  <p className="text-xs sm:text-sm text-slate-900 dark:text-white">Languages</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">English, Spanish, French</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 sm:p-6 text-white shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold">Enterprise Solutions</h3>
            <p className="mt-2 text-xs sm:text-sm text-indigo-100">
              Need custom model training or dedicated support? Our enterprise team is here to help.
            </p>
            <button className="mt-4 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
              Schedule Consultation
            </button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">Send us a message</h3>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">
                  Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border-0 py-2 sm:py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-900 dark:text-white dark:ring-slate-600 dark:placeholder:text-slate-500"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">
                  Email
                </label>
                <div className="mt-2">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border-0 py-2 sm:py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-900 dark:text-white dark:ring-slate-600 dark:placeholder:text-slate-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">
                Subject
              </label>
              <div className="mt-2">
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-0 py-2 sm:py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-900 dark:text-white dark:ring-slate-600"
                >
                  <option value="">Select a topic</option>
                  <option value="support">Technical Support</option>
                  <option value="feedback">Product Feedback</option>
                  <option value="enterprise">Enterprise Inquiry</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">
                Message
              </label>
              <div className="mt-2">
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-0 py-2 sm:py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-900 dark:text-white dark:ring-slate-600 dark:placeholder:text-slate-500"
                  placeholder="How can we help you?"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We'll respond within 24 hours. Check your spam folder if you don't hear from us.
              </p>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">Frequently Asked Questions</h3>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">How accurate are the predictions?</h4>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Our AI model achieves 95%+ accuracy on validated datasets. Accuracy improves with more historical data.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Is my data secure?</h4>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Yes, we use end-to-end encryption and comply with GDPR/CCPA regulations. Data is never shared.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Can I integrate with my CRM?</h4>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enterprise plans include API access for seamless integration with Salesforce, HubSpot, and more.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">What data format is supported?</h4>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              We support CSV and JSON files. The upload wizard will guide you through mapping your data fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
