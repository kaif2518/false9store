import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">
      <img className="hero-photo" src="/images/ly-hero.jpg" alt="" />
      <div className="hero-copy">
        <h2>
          The <span className="nine">9</span> nobody marks.
        </h2>
        <p>Fan, player, retro and kids kits. Pay cash on delivery.</p>
        <Link to="/shop" className="hero-cta">
          Shop jerseys
        </Link>
      </div>
    </section>
  );
}

export default Hero;