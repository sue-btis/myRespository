import React from 'react';
import "./sidebar.css";
const Sidebar = () => {

    const [toggle, showMenu] = React.useState(false);

    return(
        <>
            <aside className={toggle ? 'aside show-menu' : 'aside'}>
                <a href="https://github.com/sue-btis" title="Github" className="nav__social-link" target="_blank">
                    <i className="icon-social-github"></i>
                </a>

                <nav className="nav">
                    <div className="nav__menu">
                        <ul className="nav">
                            <li className="nav__item">
                                <a href="#home" className="nav__link" >
                                    <i className="icon-home"></i>
                                </a>
                            </li>
                            <li className="nav__item">
                                <a href="#about" className="nav__link">
                                    <i className="icon-user"></i>
                                </a>
                            </li>
                            <li className="nav__item">
                                <a href="#services" className="nav__link">
                                    <i className="icon-briefcase"></i>
                                </a>
                            </li>
                            <li className="nav__item">
                                <a href="#resume" className="nav__link">
                                    <i className="icon-graduation"></i>
                                </a>
                            </li>
                            <li className="nav__item">
                                <a href="#contact" className="nav__link">
                                    <i className="icon-bubble"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>

                <div className="nav__footer">
                <span className="copyright">
                     &copy; 2025.
                </span>
                </div>

            </aside>

            <div className={toggle ? "nav__toggle nav__toggle-open" : "nav__toggle"}
            onClick={() => showMenu(!toggle)}>
                <i className="icon-menu "></i>
            </div>
        </>

    )

}
export default Sidebar;