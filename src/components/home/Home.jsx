import React from "react";
import "./home.css";
import Me from "../../assets/me.jpeg";
import HeaderSocials  from "./HeaderSocials.jsx";
import ScrollDown  from "./ScrollDown.jsx";
import Background  from "./Background.jsx";

const Home = () => {
    return (
        <section className="home container" id="home">
            <Background />
            <div className="intro">
                <img src={Me} alt="" className="home__img"/>
                <h1 className="home__name">I'm Josue Escobar</h1>
                <p className="home__description">As a developer, I'm passionate about exploring new technologies, learning every day, and turning ideas into code.</p>
                <HeaderSocials />
                <a href="#contact" className="btn">Hire Me</a>

                <ScrollDown />
            </div>
        </section>
    )
}

export default Home;