import React, {useRef} from "react";
import "./contact.css";
import emailjs from "@emailjs/browser";

const Contact = () => {
    const form = useRef();

    const sendEmail = (e) => {
        e.preventDefault();

        emailjs.sendForm(
            import.meta.env.VITE_API_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_API_EMAILJS_TEMPLATE_ID,
            form.current,
            import.meta.env.VITE_API_EMAILJS_PUBLIC_KEY
        )
            .then((result) => {
                console.log(result.text);
                alert("Message sent successfully!");
                form.current.reset();
            }, (error) => {
                console.log(error.text);
                alert("An error occurred. Please try again.");
            });
    };

    return (
        <section className="contact container section" id="contact">
            <h2 className="section__title">Get in touch</h2>
            <div className="contact__container grid">
                <div className="contact__info">
                    <h3 className="contact__title">Let's talk</h3>
                    <p className="contact__details">Send me an email</p>
                </div>

                <form ref={form} onSubmit={sendEmail} className="contact__form">
                    <div className="contact__form-group">
                        <div className="contact__form-div">
                            <input
                                type="text"
                                name="name"
                                className="contact__form-input"
                                placeholder="Insert your name"
                                required
                            />
                        </div>

                        <div className="contact__form-div">
                            <input
                                type="email"
                                name="email"
                                className="contact__form-input"
                                placeholder="Insert your email"
                                required
                            />
                        </div>
                    </div>

                    <div className="contact__form-div">
                        <input
                            type="text"
                            name="subject"
                            className="contact__form-input"
                            placeholder="Insert your subject"
                            required
                        />
                    </div>

                    <div className="contact__form-div">
                        <textarea
                            name="message"
                            cols="30"
                            rows="10"
                            className="contact__form-input"
                            placeholder="Write your message"
                            required
                        ></textarea>
                    </div>

                    <button type="submit" className="btn">Send Message</button>
                </form>

            </div>
        </section>
    );
};

export default Contact;
