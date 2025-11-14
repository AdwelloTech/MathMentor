import './Student.css';
import './css/home.css';
import LandingFooter from '../../components/landing/LandingFooter';
import { LandingNavbar } from '../../components/landing/LandingNavbar';
import { useEffect } from 'react';

function LandingHome() {
  // Preload critical images for faster initial load
  useEffect(() => {
    const criticalImages = [
      '/home/home-bg.webp',
      '/home/hero-bg.webp',
      '/home/hero-button.webp'
    ];
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, []);

  return (
    <>
      <LandingNavbar />
      <div
        className="w-full relative"
        style={{
          backgroundColor: "#0D0D0D",
          backgroundImage: "url(/home/home-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
          fontFamily: '"ClashOfClans", sans-serif',
        }}
      >
        {/* Hero Section Content */}
        <div className="flex flex-col items-center justify-start pt-16 sm:pt-20 md:justify-center md:pt-0 h-full relative z-10 min-h-screen">
          {/* Hero Sign/Board */}
          <div className="relative flex justify-center items-center w-full">
            <img
              src="/home/hero-bg.webp"
              alt="Hero wooden sign"
              className="w-full h-auto object-cover"
            />

            {/* Text overlay on the hero sign */}
            <div className="absolute inset-0 flex flex-col justify-center items-center px-8 sm:px-12 md:px-16" style={{ transform: "translateY(-2%)" }}>
              <style>{`
                .mobile-title {
                  font-size: 12px !important;
                }
                @media (min-width: 640px) {
                  .mobile-title {
                    font-size: 1.25rem !important;
                  }
                }
                @media (min-width: 768px) {
                  .mobile-title {
                    font-size: 2.25rem !important;
                  }
                }
                @media (min-width: 1024px) {
                  .mobile-title {
                    font-size: 3rem !important;
                  }
                }
                @media (min-width: 1280px) {
                  .mobile-title {
                    font-size: 3.75rem !important;
                  }
                }
                @media (min-width: 1536px) {
                  .mobile-title {
                    font-size: 5.5rem !important;
                  }
                }
              `}</style>
              {/* Main Title */}
              <div className=" text-center mb-4 sm:mb-6 md:mb-8">
                <h1
                  className="mobile-title font-clash-bold leading-tight mb-1 sm:mb-2 md:mb-3"
                  style={{
                    color: "#A25B2B",
                    textShadow: "2px 2px 4px #F2F1EF",
                  }}
                >
                  Empowering <br /> Future <br /> Mathematicians
                </h1>
              </div>

              {/* Subtitle */}
              <div className="text-center mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
                <p
                  className="text-[8px] sm:text-sm md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-clash leading-relaxed"
                  style={{
                    color: "#45290E",
                    textShadow: "1px 1px 2px #FFFFFF",
                  }}
                >
                  Empowering students to
                </p>
                <p
                  className="text-[8px] sm:text-sm md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-clash leading-relaxed"
                  style={{
                    color: "#45290E",
                    textShadow: "1px 1px 2px #FFFFFF",
                  }}
                >
                  master mathematics through
                </p>
                <p
                  className="text-[8px] sm:text-sm md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-clash leading-relaxed"
                  style={{
                    color: "#45290E",
                    textShadow: "1px 1px 2px #FFFFFF",
                  }}
                >
                  personalized learning experiences.
                </p>
              </div>
              {/* CTA button anchored under board */}
              <a
                href="#start"
                aria-label="Start Free Trial"
                className="absolute left-1/2 transform -translate-x-1/2 hover:scale-105 transition-transform duration-200 bottom-[-15%] sm:bottom-[-3%]"
              >
                <div className="relative">
                  <img
                    src="/home/hero-button.webp"
                    alt="Start Free Trial button"
                    className="w-auto h-auto max-w-[180px] sm:max-w-[300px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[480px] 2xl:max-w-[540px]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-base md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-clash">
                      Start Free Trial
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Second Section - Why Choose Math Mentor */}
          <div className="w-full relative py-16 sm:py-20 md:py-24 lg:py-32 xl:py-40 2xl:py-48">
            <div className="w-full max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-0 xl:px-0 2xl:px-0">
              {/* Section Title */}
              <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-clash-bold leading-tight mb-4 sm:mb-6 md:mb-8"
                  style={{
                    color: "#FDCB3F",
                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  WHY CHOOSE MATH MENTOR?
                </h2>
                <p
                  className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-clash text-white leading-relaxed max-w-4xl mx-auto"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  Discover WHY OUR platform is the perfect CHOICE for YOUR Math journey.
                </p>
              </div>

              {/* Desktop Layout - 3 cards in a row */}
              <div className="hidden lg:flex lg:flex-row justify-center items-stretch gap-4 xl:gap-6 2xl:gap-8 w-full">
                {/* Card 1 - Personalized Learning Paths */}
                <div className="relative w-full flex-1 lg:w-[35%] xl:w-[36%] 2xl:w-[38%] hover:scale-105 transition-transform duration-200">
                  <img
                    src="/home/section2.webp"
                    alt="Personalized Learning Paths"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-8 xl:p-10 testimonial-content">
                    <h3
                      className="text-xl xl:text-2xl 2xl:text-4xl font-clash-bold text-center mt-6 leading-tight"
                      style={{ color: "#A25B2B" }}
                    >
                      Personalized<br />Learning<br />Paths
                    </h3>
                  </div>
                </div>

                {/* Card 2 - Rapid Skill Development */}
                <div className="relative w-full flex-1 lg:w-[35%] xl:w-[36%] 2xl:w-[38%] hover:scale-105 transition-transform duration-200">
                  <img
                    src="/home/section2.webp"
                    alt="Rapid Skill Development"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-8 xl:p-10 testimonial-content">
                    <h3
                      className="text-xl xl:text-2xl 2xl:text-3xl font-clash-bold text-center mt-6 leading-tight"
                      style={{ color: "#A25B2B" }}
                    >
                      Rapid Skill<br />Development<br />Path
                    </h3>
                  </div>
                </div>

                {/* Card 3 - Comprehensive Concept Mastery */}
                <div className="relative w-full flex-1 lg:w-[35%] xl:w-[36%] 2xl:w-[38%] hover:scale-105 transition-transform duration-200">
                  <img
                    src="/home/section2.webp"
                    alt="Comprehensive Concept Mastery"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-8 xl:p-10 testimonial-content">
                    <h3
                      className="text-xl xl:text-2xl 2xl:text-3xl font-clash-bold text-center mt-6 leading-tight"
                      style={{ color: "#A25B2B" }}
                    >
                      Comprehensive<br />Concept<br />Mastery
                    </h3>
                  </div>
                </div>
              </div>

              {/* Tablet Layout - Single column with smaller cards */}
              <div className="hidden md:flex lg:hidden flex-col items-center gap-20">
                {/* Card 1 - Personalized Learning Paths */}
                <div className="relative w-full max-w-[500px]">
                  <img
                    src="/home/section2.webp"
                    alt="Personalized Learning Paths"
                    className="w-full h-auto object-contain scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-16 pt-16 pb-12">
                    <h3
                      className="text-base font-clash-bold text-center mb-3"
                      style={{ color: "#A25B2B" }}
                    >
                      Personalized<br />Learning<br />Paths
                    </h3>
                  </div>
                </div>

                {/* Card 2 - Rapid Skill Development */}
                <div className="relative w-full max-w-[500px]">
                  <img src="/home/section2.webp"
                    alt="Rapid Skill Development"
                    className="w-full h-auto object-contain scale-110" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-16 pt-16 pb-12">
                    <h3
                      className="text-base font-clash-bold text-center mb-3"
                      style={{ color: "#A25B2B" }}
                    >
                      Rapid Skill<br />Development<br />Path
                    </h3>
                  </div>
                </div>

                {/* Card 3 - Comprehensive Concept Mastery */}
                <div className="relative w-full max-w-[500px]">
                  <img src="/home/section2.webp"
                    alt="Comprehensive Concept Mastery"
                    className="w-full h-auto object-contain scale-110" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-16 pt-16 pb-12">
                    <h3
                      className="text-base font-clash-bold text-center mb-3"
                      style={{ color: "#A25B2B" }}
                    >
                      Comprehensive<br />Concept<br />Mastery
                    </h3>
                  </div>
                </div>
              </div>

              {/* Mobile Layout - Single column */}
              <div className="md:hidden flex flex-col items-center gap-24 sm:gap-28">
                {/* Card 1 - Personalized Learning Paths */}
                <div className="relative w-full max-w-[350px] sm:max-w-[400px]">
                  <img src="/home/section2.webp"
                    alt="Personalized Learning Paths"
                    className="w-full h-auto object-contain" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-6 sm:p-8 testimonial-content">
                    <h3
                      className="text-lg sm:text-xl font-clash-bold text-center mb-2 sm:mb-3 leading-tight"
                      style={{ color: "#A25B2B" }}
                    >
                      Personalized<br />Learning<br />Paths
                    </h3>
                  </div>
                </div>

                {/* Card 2 - Rapid Skill Development */}
                <div className="relative w-full max-w-[350px] sm:max-w-[400px]">
                  <img src="/home/section2.webp"
                    alt="Rapid Skill Development"
                    className="w-full h-auto object-contain" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-6 sm:p-8 testimonial-content">
                    <h3
                      className="text-lg sm:text-xl font-clash-bold text-center mb-2 sm:mb-3 leading-tight"
                      style={{ color: "#A25B2B" }}
                    >
                      Rapid Skill<br />Development<br />Path
                    </h3>
                  </div>
                </div>

                {/* Card 3 - Comprehensive Concept Mastery */}
                <div className="relative w-full max-w-[350px] sm:max-w-[400px]">
                  <img src="/home/section2.webp"
                    alt="Comprehensive Concept Mastery"
                    className="w-full h-auto object-contain" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-6 sm:p-8 testimonial-content">
                    <h3
                      className="text-lg sm:text-xl font-clash-bold text-center mb-2 sm:mb-3 leading-tight"
                      style={{ color: "#A25B2B" }}
                    >
                      Comprehensive<br />Concept<br />Mastery
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Section - Section 3 */}
          <div className="w-full relative px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
            {/* Desktop Image */}
            <div className="relative hidden md:block">
              <img src="/home/section3.webp"
                alt="Section 3"
                className="w-full h-auto object-cover scale-75" loading="lazy"
              />
              {/* Text Overlay for Desktop */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24 2xl:px-28" style={{ transform: 'translateX(-16.5%) translateY(-20px)' }}>
                {/* "FOR Students" Title */}
                <div className="mb-4 sm:mb-6 md:mb-8 text-center w-full">
                  <h2
                    className="home-card-title text-2xl sm:text-3xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-6xl font-clash-bold leading-tight"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    For<br />Students
                  </h2>
                </div>

                {/* Main Body Text */}
                <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-14 2xl:mb-16 max-w-[640px] mx-auto text-center">
                  <p
                    className="text-sm sm:text-base md:text-base lg:text-xl xl:text-2xl 2xl:text-3xl font-clash text-white leading-relaxed"
                    style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                  >
                    Ready to take your math<br />
                    skills to the next level?<br />
                    Join thousands of<br />
                    students mastering math<br />
                    with our interactive,<br />
                    customized curriculum.
                  </p>
                </div>

                {/* Start Learning Today Text */}
                <div className="absolute top-[80%] md:top-[74%] lg:top-[72.4%] left-1/2 transform -translate-x-[133px]">
                  <p
                    className="home-card-button-s text-white font-clash-bold text-sm sm:text-base md:text-xs lg:text-lg xl:text-xl 2xl:text-1xl"
                    style={{
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    Start Learning Today
                  </p>
                </div>

              </div>
            </div>

            {/* Mobile Image */}
            <div className="relative block md:hidden">
              <img src="/home/section3mobile.webp"
                alt="Section 3 Mobile"
                className="w-full h-auto object-cover" loading="lazy"
              />
              {/* Text Overlay for Mobile */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 sm:px-6" style={{ transform: 'translateY(-15px)' }}>
                {/* "FOR Students" Title */}
                <div className="mb-3 sm:mb-4">
                  <h2
                    className="text-lg sm:text-xl font-clash-bold leading-tight"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    For<br />Students
                  </h2>
                </div>

                {/* Main Body Text */}
                <div className="mb-4 sm:mb-6 max-w-xs">
                  <p
                    className="text-xs sm:text-sm font-clash text-white leading-relaxed"
                    style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                  >
                    Ready to take your math<br />
                    skills to the next level?<br />
                    Join thousands of<br />
                    students mastering math<br />
                    with our interactive,<br />
                    customized curriculum.
                  </p>
                </div>

                {/* Start Learning Today Text */}
                <div className="absolute top-[82%] left-1/2 transform -translate-x-1/2">
                  <p
                    className="text-white font-clash-bold text-[7px] sm:text-[9px]"
                    style={{
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    Start Learning Today
                  </p>
                </div>

              </div>
            </div>
          </div>



          {/* Fourth Section - Section 4 */}
          <div className="w-full relative px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
            {/* Desktop Image */}
            <div className="relative hidden md:block">
              <img src="/home/section4.webp"
                alt="Section 4"
                className="w-full h-auto object-cover scale-75" loading="lazy"
              />
              {/* Text Overlay for Desktop */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24 2xl:px-28" style={{ transform: 'translateX(18.5%) translateY(-20px)' }}>
                {/* "FOR Tutors" Title */}
                <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-14 2xl:mb-16 text-center w-full" style={{ transform: 'translateY(24px)' }}>
                  <h2
                    className="home-card-title text-2xl sm:text-3xl md:text-3xl lg:text-5xl xl:text-6xl 2xl:text-6xl font-clash-bold leading-tight"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    For<br />Tutors
                  </h2>
                </div>
                {/* Main Body Text */}
                <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-14 xl:mb-16 2xl:mb-18 max-w-[640px] mx-auto text-center">
                  <p
                    className="text-sm sm:text-base md:text-base lg:text-xl xl:text-2xl 2xl:text-3xl font-clash text-white leading-relaxed"
                    style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                  >
                    Ready to take your math<br />
                    skills to the next level?<br />
                    Join thousands of<br />
                    students mastering math<br />
                    with our interactive,<br />
                    customized curriculum.
                  </p>
                </div>
                {/* Start Learning Today Text */}
                <div className="absolute top-[81%] md:top-[83%] lg:top-[73%] right-1/2 transform -translate-x-[-115px]">
                  <p
                    className="home-card-button-t text-white font-clash-bold text-sm sm:text-base md:text-xs lg:text-lg xl:text-xl 2xl:text-1xl"
                    style={{
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    Start Learning Today
                  </p>
                </div>
              </div>
            </div>
            {/* Mobile Image */}
            <div className="relative block md:hidden">
              <img src="/home/section3mobile.webp"
                alt="Section 4 Mobile"
                className="w-full h-auto object-cover" loading="lazy"
              />
              {/* Text Overlay for Mobile */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 sm:px-6" style={{ transform: 'translateY(-15px)' }}>
                {/* "FOR Tutors" Title */}
                <div className="mb-3 sm:mb-4" style={{ transform: 'translateY(8px)' }}>
                  <h2
                    className="text-lg sm:text-xl font-clash-bold leading-tight"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    FOR<br />Tutors
                  </h2>
                </div>
                {/* Main Body Text */}
                <div className="mb-4 sm:mb-6 max-w-xs">
                  <p
                    className="text-xs sm:text-sm font-clash text-white leading-relaxed"
                    style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                  >
                    Ready to take your math<br />
                    skills to the next level?<br />
                    Join thousands of<br />
                    students mastering math<br />
                    with our interactive,<br />
                    customized curriculum.
                  </p>
                </div>
                {/* Start Learning Today Text */}
                <div className="absolute top-[82%] left-1/2 transform -translate-x-1/2">
                  <p
                    className="text-white font-clash-bold text-[7px] sm:text-[9px]"
                    style={{
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    Start Learning Today
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Fifth Section - What Our Students Say */}
          <div className="w-full relative pt-16 sm:pt-20 md:pt-24 lg:pt-4 xl:pt-6 2xl:pt-8 pb-8 sm:pb-10 md:pb-12 lg:pb-16 xl:pb-20 2xl:pb-24">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              {/* Section Title */}
              <div className="text-center mb-20 sm:mb-24 md:mb-28 lg:mb-16 xl:mb-20">
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-clash-bold leading-tight mb-2 sm:mb-3 md:mb-4"
                  style={{
                    color: "#FDCB3F",
                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                    fontFamily: '"ClashOfClans", sans-serif',
                  }}
                >
                  What Our Students Say
                </h2>
                <p
                  className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-clash text-white leading-relaxed max-w-4xl mx-auto"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  Hear from students who've<br />
                  mastered math with us.
                </p>
              </div>

              {/* Desktop Layout - 3 cards in a row */}
              <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 xl:gap-6 2xl:gap-8 place-items-center">
                {/* Testimonial Card 1 */}
                <div className="relative w-full max-w-[600px] xl:max-w-[750px] 2xl:max-w-[900px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-110 xl:scale-125 2xl:scale-140" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-20 xl:-top-18 2xl:-top-16 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-40 h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-14 xl:-top-12 2xl:-top-10 left-1/2 transform -translate-x-1/2 w-28 h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-10 xl:px-12 2xl:px-16 pt-24 xl:pt-28 2xl:pt-32 pb-12 xl:pb-16 2xl:pb-20">
                    {/* Student Name */}
                    <h3
                      className="text-base xl:text-lg 2xl:text-xl font-clash-bold text-center mb-2 xl:mb-3 2xl:mb-4"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3 xl:mb-4 2xl:mb-5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="text-yellow-500 text-xl xl:text-2xl 2xl:text-3xl mx-0.5"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-xs xl:text-sm 2xl:text-base font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>

                {/* Testimonial Card 2 */}
                <div className="relative w-full max-w-[600px] xl:max-w-[750px] 2xl:max-w-[900px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-110 xl:scale-125 2xl:scale-140" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-20 xl:-top-18 2xl:-top-16 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-40 h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-14 xl:-top-12 2xl:-top-10 left-1/2 transform -translate-x-1/2 w-28 h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-10 xl:px-12 2xl:px-16 pt-24 xl:pt-28 2xl:pt-32 pb-12 xl:pb-16 2xl:pb-20">
                    {/* Student Name */}
                    <h3
                      className="text-base xl:text-lg 2xl:text-xl font-clash-bold text-center mb-2 xl:mb-3 2xl:mb-4"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3 xl:mb-4 2xl:mb-5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="text-yellow-500 text-xl xl:text-2xl 2xl:text-3xl mx-0.5"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-xs xl:text-sm 2xl:text-base font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>

                {/* Testimonial Card 3 */}
                <div className="relative w-full max-w-[600px] xl:max-w-[750px] 2xl:max-w-[900px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-110 xl:scale-125 2xl:scale-140" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-20 xl:-top-18 2xl:-top-16 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-40 h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-14 xl:-top-12 2xl:-top-10 left-1/2 transform -translate-x-1/2 w-28 h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-10 xl:px-12 2xl:px-16 pt-24 xl:pt-28 2xl:pt-32 pb-12 xl:pb-16 2xl:pb-20">
                    {/* Student Name */}
                    <h3
                      className="text-base xl:text-lg 2xl:text-xl font-clash-bold text-center mb-2 xl:mb-3 2xl:mb-4"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3 xl:mb-4 2xl:mb-5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="text-yellow-500 text-xl xl:text-2xl 2xl:text-3xl mx-0.5"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-xs xl:text-sm 2xl:text-base font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>
              </div>

              {/* Tablet Layout - Single column with smaller cards */}
              <div className="hidden md:flex lg:hidden flex-col items-center gap-20">
                {/* Testimonial Card 1 */}
                <div className="relative w-full max-w-[500px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-110" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-60 h-60" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-44 h-44 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-16 pt-16 pb-12">
                    {/* Student Name */}
                    <h3
                      className="text-base font-clash-bold text-center mb-3"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-500 text-lg mx-0.5">
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-sm font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>

                {/* Testimonial Card 2 */}
                <div className="relative w-full max-w-[500px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-110" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-60 h-60" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-44 h-44 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-16 pt-16 pb-12">
                    {/* Student Name */}
                    <h3
                      className="text-base font-clash-bold text-center mb-3"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-500 text-lg mx-0.5">
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-sm font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>

                {/* Testimonial Card 3 */}
                <div className="relative w-full max-w-[500px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-110" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-60 h-60" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-44 h-44 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-16 pt-16 pb-12">
                    {/* Student Name */}
                    <h3
                      className="text-base font-clash-bold text-center mb-3"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-500 text-lg mx-0.5">
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-sm font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Layout - Single column */}
              <div className="md:hidden flex flex-col items-center gap-24 sm:gap-28">
                {/* Testimonial Card 1 */}
                <div className="relative w-full max-w-[500px] sm:max-w-[600px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-135 sm:scale-150" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-13 sm:-top-12 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-44 h-44 sm:w-48 sm:h-48" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-7 sm:-top-6 left-1/2 transform -translate-x-1/2 w-32 h-32 sm:w-32 sm:h-32 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-6 sm:px-8 pt-20 sm:pt-24 pb-10 sm:pb-12">
                    {/* Student Name */}
                    <h3
                      className="text-base sm:text-base font-clash-bold text-center mb-2 sm:mb-3"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3 sm:mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="text-yellow-500 text-lg sm:text-lg mx-0.5"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-sm sm:text-sm font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>

                {/* Testimonial Card 2 */}
                <div className="relative w-full max-w-[500px] sm:max-w-[600px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-135 sm:scale-150" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-13 sm:-top-12 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-44 h-44 sm:w-48 sm:h-48" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-7 sm:-top-6 left-1/2 transform -translate-x-1/2 w-32 h-32 sm:w-32 sm:h-32 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-6 sm:px-8 pt-20 sm:pt-24 pb-10 sm:pb-12">
                    {/* Student Name */}
                    <h3
                      className="text-base sm:text-base font-clash-bold text-center mb-2 sm:mb-3"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3 sm:mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="text-yellow-500 text-lg sm:text-lg mx-0.5"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-sm sm:text-sm font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>

                {/* Testimonial Card 3 */}
                <div className="relative w-full max-w-[500px] sm:max-w-[600px]">
                  <img src="/About/about-rating-card.webp"
                    alt="Student testimonial card"
                    className="w-full h-auto object-contain scale-135 sm:scale-150" loading="lazy"
                  />
                  {/* Rating Circle */}
                  <div className="absolute -top-13 sm:-top-12 left-1/2 transform -translate-x-1/2 z-10">
                    <img src="/About/about-rating-circle.webp"
                      alt="Rating circle"
                      className="w-44 h-44 sm:w-48 sm:h-48" loading="lazy"
                    />
                  </div>
                  {/* Profile Image */}
                  <div className="absolute -top-7 sm:-top-6 left-1/2 transform -translate-x-1/2 w-32 h-32 sm:w-32 sm:h-32 rounded-full overflow-hidden z-20">
                    <img src="/About/about-rating-image.webp"
                      alt="Student profile"
                      className="w-full h-full object-cover" loading="lazy"
                    />
                  </div>
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center px-6 sm:px-8 pt-20 sm:pt-24 pb-10 sm:pb-12">
                    {/* Student Name */}
                    <h3
                      className="text-base sm:text-lg font-clash-bold text-center mb-2 sm:mb-3"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Sajad AHamed
                    </h3>
                    {/* Star Rating */}
                    <div className="flex justify-center mb-3 sm:mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="text-yellow-500 text-lg sm:text-xl mx-0.5"
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Testimonial Text */}
                    <p
                      className="text-sm sm:text-base font-clash text-center leading-relaxed"
                      style={{
                        color: "white",
                        fontFamily: '"ClashOfClans", sans-serif',
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                      }}
                    >
                      Join our community in minutes by creating your free tutor
                      profile. Highlight your skills, set your subjects
                    </p>
                  </div>
                </div>
              </div>

              {/* See More Button */}
              <div className="flex justify-center mt-6 sm:mt-8 md:mt-10">
                <div className="relative hover:scale-105 transition-transform duration-200">
                  <img src="/home/seemore.webp"
                    alt="See More button"
                    className="w-auto h-auto max-w-[160px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[260px] 2xl:max-w-[280px]" loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold font-clash text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl">See More</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gap between sections and footer */}
          <div className="w-full py-2 lg:py-3 xl:py-4 2xl:py-5"></div>
        </div>
      </div>

      {/* Full width footer */}
      <div style={{ backgroundColor: '#0D0D0D' }}>
        <LandingFooter />
      </div>

    </>
  );
}

export default LandingHome;