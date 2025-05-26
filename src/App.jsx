import React, {useRef,useEffect} from "react";
import './App.css'
import Sidebar from './components/sidebar/Sidebar';
import Home from './components/home/Home';
import About from './components/about/About';
import Services from './components/services/Services';
import Resume from './components/resume/Resume';
import Portfolio from './components/portfolio/Portfolio';
import Contact from './components/contact/Contact';


function App() {

    const aboutRef = useRef(null);
    useEffect(() => {
        const handleScroll = () => {
            if(window.scrollY > 30){
                aboutRef.current?.scrollIntoView({behavior: "smooth"});
                window.removeEventListener("scroll", handleScroll);
            }
        }
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        }
    }, []);
    return (
        <>
            <Sidebar/>
            <main className="main">
                <Home/>
                <div className="aboutRef">
                    <About/>
                </div>
                <Services/>
                <Resume/>
                <Portfolio/>
                <Contact/>
            </main>
        </>
    );
}

export default App
