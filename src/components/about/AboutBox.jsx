import React from "react";
import "./about.css";

const AboutBox = () => {
    return (
        <div className="about__boxes grid" >

            <div className="about__box">
                <i className="about__icon icon-fire"></i>

                <div>
                    <h3 className="about__title">299</h3>
                    <span className="about__subtitle">CodeWars kata</span>
                </div>
            </div>

            <div className="about__box">
                <i className="about__icon icon-cup"></i>

                <div>
                    <h3 className="about__title">113</h3>
                    <span className="about__subtitle">LeetCode problems</span>
                </div>
            </div>

            <div className="about__box">
                <i className="about__icon icon-people"></i>

                <div>
                    <h3 className="about__title">2</h3>
                    <span className="about__subtitle">Proyects</span>
                </div>
            </div>

        </div>
    );
};

export default AboutBox;