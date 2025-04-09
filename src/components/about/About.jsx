import React from "react";
import "./about.css";
import Me from "../../assets/me.jpeg";
import AboutBox from "./AboutBox.jsx";

const About = () => {
    return (
        <section className="about container section" id="about">
            <h2 className="section__title">About Me</h2>

            <div className="about__container grid">
                <img src={Me} alt="" className="about__img"/>

                <div className="about__data grid">
                    <div className="about__info">
                        <p className="about__description">
                            I'm passionate about problem-solving and exploring new ideas. I enjoy tackling complex challenges, whether it's programming or designing. My curiosity and dedication drive me to learn independently and strive to improve in my areas of interest, always staying focused on my goals.
                        </p>
                        <a href="/CV_JOSUE_ESCOBAR 2025.pdf" download="CV_JOSUE_ESCOBAR.pdf" className="btn">Download CV</a>
                    </div>


                    <div className="about__skills grid">
                        <div className="skills__data">
                            <div className="skills__title">
                                <h3 className="skills__name">Development  </h3>
                                <span className="skills__number">80%</span>
                            </div>

                            <div className="skills__bar">
                                <span className="skills__percentage development"></span>
                            </div>
                        </div>

                        <div className="skills__data">
                            <div className="skills__title">
                                <h3 className="skills__name">Mechanical Designs</h3>
                                <span className="skills__number">80%</span>
                            </div>

                            <div className="skills__bar">
                                <span className="skills__percentage design"></span>
                            </div>
                        </div>


                    </div>
                </div>
            </div>

            <AboutBox />
        </section>
    )
}

export default About;

