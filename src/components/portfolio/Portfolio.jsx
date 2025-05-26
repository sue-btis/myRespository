import React,{ useState } from "react";
import "./portfolio.css";
import Menu from "./Menu";

const Portfolio = () => {
    const [items, setItems] = useState(Menu);
    const filterItem = (categoryItem) => {
        const updatedItems = Menu.filter((curElem) => {
            return curElem.category === categoryItem;
        })
        setItems(updatedItems);
    }

    return (
        <section className="work container section" id="portfolio">
            <h2 className="section__title">Recent works</h2>
            <div className="work__filters">
                <span className="work__item" onClick={() => setItems(Menu)}>Everything</span>
                <span className="work__item" onClick={() => filterItem("Full Stack")}>Full Stack</span>
                <span className="work__item" onClick={() => filterItem("Data Science")}>Data Science</span>
            </div>

            <div className="work__container grid">
                {items.map((item) => {
                    const{id, image, title,category} = item;
                    return(
                        <div className="work__card" key={id}>
                            <div className="work__thumbnail">
                                <img src={image} alt={title} className="work__img" />
                                <div className="work__mask"></div>
                            </div>
                                <span className="work__category">{category}</span>
                                <h3 className="work__title">{title}</h3>
                            <a href={item.github} className="work__button" target="_blank" rel="noopener noreferrer">
                                <i className="icon-link work__button-icon"></i>
                            </a>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
export default Portfolio;