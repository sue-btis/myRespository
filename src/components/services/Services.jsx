import React from "react";
import "./services.css";
import Image1 from "../../assets/service-1.svg";
import Image2 from "../../assets/service-2.svg";
import Image3 from "../../assets/service-3.svg";

const Services = () => {

    const data = [
        {
            id: 1,
            image: Image1,
            title: "Web Development",
            description: "Creation of modern, responsive websites and dynamic web applications using HTML, CSS, JavaScript, and frameworks such as React and Angular. Focused on intuitive user experiences and robust backend integration with technologies like Java",
        },
        {
            id: 2,
            image: Image2,
            title: "Data Science",
            description: "Comprehensive data analysis, interactive visualization, and predictive modeling with Python and R. Skilled in extracting insights from datasets, applying machine learning algorithms, and communicating results through compelling dashboards.",
        },
        {
            id: 3,
            image: Image3,
            title: "Mechanical Design",
            description: "End-to-end design of mechanical components and systems, from initial concept sketches to 3D modeling and prototyping. Using CAD tools like SolidWorks and Fusion 360",
        },
    ];



    return (
        <section className="services container section" id="services">
            <h2 className="section__title">Services</h2>

            <div className="services__container grid">

                {
                    data.map(({ id, image, title, description }) => {
                        return (
                            <div className="services__card" key={id}>
                                <img src={image} alt="" className="services__img" />
                                <h3 className="services__title">{title}</h3>
                                <p className="services__description">{description}</p>
                            </div>
                        );})}
            </div>
        </section>

    )
}
export default Services;