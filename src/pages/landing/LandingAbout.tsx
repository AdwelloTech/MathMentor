import LandingFooter from "../../components/landing/LandingFooter";
import { LandingNavbar } from "../../components/landing/LandingNavbar";
import './css/about.css';

function LandingAbout() {
  return (
    <>
      <LandingNavbar />
      <div
        className="w-full relative"
        style={{
          backgroundColor: "#0D0D0D",
          backgroundImage: "url(/About/About-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
          fontFamily: '"ClashOfClans", sans-serif',
        }}
      >
        {/* Branch decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <img src="/About/branch-1.webp"
            alt="Branch decoration 1"
            className="absolute top-0 left-0 w-auto h-auto max-w-[180px] sm:max-w-[250px] md:max-w-[350px] lg:max-w-[400px] xl:max-w-[600px] 2xl:max-w-none"
            style={{ zIndex: 20 }} loading="lazy"
          />
          <img src="/About/branch-2.webp"
            alt="Branch decoration 2"
            className="absolute top-0 right-0 w-auto h-auto max-w-[180px] sm:max-w-[250px] md:max-w-[350px] lg:max-w-[400px] xl:max-w-[900px] 2xl:max-w-none"
            style={{ zIndex: 20 }} loading="lazy"
          />
        </div>

        {/* Content wrapper */}
        <div className="flex flex-col items-center justify-start h-full relative z-10 xl:flex-row xl:items-start xl:justify-center xl:pl-72 2xl:pl-96 xl:pt-0 2xl:pt-0">
          {/* Wizard */}
          <div
            className="about-hero-img pointer-events-none order-2 xl:absolute xl:left-24 2xl:left-70 xl:top-20 2xl:top-24"
            style={{ zIndex: 4 }}
          >
            <img src="/About/wizard.webp"
              alt="Wizard character"
              className="w-auto h-auto max-h-[320px] sm:max-h-[380px] md:max-h-[450px] xl:max-h-[550px] 2xl:max-h-[650px] 3xl:max-h-[750px]" loading="lazy"
            />
          </div>

          {/* Board */}
          <div
            className="relative order-1 xl:order-2 xl:flex-shrink-0 xl:mt-0"
            style={{ zIndex: 1 }}
          >
            <img src="/About/board.webp"
              alt="Wooden board"
              className="w-full max-w-[420px] sm:max-w-[500px] md:max-w-[600px] xl:max-w-[650px] 2xl:max-w-[750px] 3xl:max-w-[850px]" loading="lazy"
            />

            {/* Text overlay*/}
            <div className="absolute inset-0 flex flex-col justify-end items-center pb-8 sm:pb-12 md:pb-16 xl:pb-20 2xl:pb-24 px-3 sm:px-4 md:px-6">
              {/* Top text */}
              <div className="text-center mb-2 sm:mb-3 md:mb-4 xl:mb-3 2xl:mb-4">
                <p
                  className="text-sm sm:text-base md:text-lg xl:text-lg 2xl:text-2xl 3xl:text-3xl font-clash leading-tight drop-shadow-lg"
                  style={{ color: "#45290E" }}
                >
                  Empowering Future
                </p>
                <p
                  className="text-sm sm:text-base md:text-lg xl:text-lg 2xl:text-2xl 3xl:text-3xl font-clash leading-tight drop-shadow-lg"
                  style={{ color: "#45290E" }}
                >
                  Mathematicians
                </p>
              </div>

              {/* Main title */}
              <div className="text-center mb-3 sm:mb-4 md:mb-6 xl:mb-4 2xl:mb-6">
                <p
                  className="text-xl sm:text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl font-clash-bold leading-tight"
                  style={{
                    color: "#FDCB3F",
                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  About Math
                </p>
                <p
                  className="text-xl sm:text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl font-clash-bold leading-tight"
                  style={{
                    color: "#FDCB3F",
                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  Mentor
                </p>
              </div>

              {/* Bottom text */}
              <div className="text-center space-y-0.5 md:space-y-1 xl:space-y-0.5 2xl:space-y-1">
                <p
                  className="text-sm sm:text-base md:text-base xl:text-base 2xl:text-lg 3xl:text-xl font-clash text-white leading-tight"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  Empowering students to
                </p>
                <p
                  className="text-sm sm:text-base md:text-base xl:text-base 2xl:text-lg 3xl:text-xl font-clash text-white leading-tight"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  Master Mathematics through
                </p>
                <p
                  className="text-sm sm:text-base md:text-base xl:text-base 2xl:text-lg 3xl:text-xl font-clash text-white leading-tight"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  personalized learning
                </p>
                <p
                  className="text-sm sm:text-base md:text-base xl:text-base 2xl:text-lg 3xl:text-xl font-clash text-white leading-tight"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  experiences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Second Section - Why Choose Math Mentor */}
        <div className="w-full relative py-16 sm:py-20 md:py-24 lg:py-32 xl:py-40 2xl:py-48">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            {/* Section Title */}
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h2
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-clash-bold leading-tight mb-1 sm:mb-2"
                style={{
                  color: "#FDCB3F",
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                }}
              >
                WHY CHOOSE MATH MENTOR?
              </h2>
              <p
                className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg font-clash text-white leading-relaxed max-w-4xl mx-auto"
                style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
              >
                Discover WHY OUR platform is the perfect CHOICE for YOUR Math
                journey.
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 place-items-center justify-items-center">
              {/* Card 1 */}
              <div className="relative group w-full max-w-[300px] sm:max-w-[350px] md:max-w-[360px] lg:max-w-[340px] xl:max-w-[360px] 2xl:max-w-[380px] mx-auto flex justify-center">
                <img src="/About/landscape-card.webp"
                  alt="Card background"
                  className="w-[300px] h-[240px] sm:w-[350px] sm:h-[280px] md:w-[360px] md:h-[288px] lg:w-[340px] lg:h-[272px] xl:w-[360px] xl:h-[288px] 2xl:w-[380px] 2xl:h-[304px] object-cover" loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                  <h3
                    className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                    style={{ color: "#A25B2B" }}
                  >
                    Personalized Learning Paths
                  </h3>
                  <p
                    className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                    style={{
                      color: "#45290E",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Customized curriculum that adapts to your unique learning
                    style, pace and goal for optimal understanding
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="relative group w-full max-w-[300px] sm:max-w-[350px] md:max-w-[360px] lg:max-w-[340px] xl:max-w-[360px] 2xl:max-w-[380px] mx-auto flex justify-center">
                <img src="/About/landscape-card.webp"
                  alt="Card background"
                  className="w-[300px] h-[240px] sm:w-[350px] sm:h-[280px] md:w-[360px] md:h-[288px] lg:w-[340px] lg:h-[272px] xl:w-[360px] xl:h-[288px] 2xl:w-[380px] 2xl:h-[304px] object-cover" loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                  <h3
                    className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                    style={{ color: "#A25B2B" }}
                  >
                    Rapid Skill Development
                  </h3>
                  <p
                    className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                    style={{
                      color: "#45290E",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Accelerate your learning with focused practice modules
                    designed to build skills efficiently
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="relative group w-full max-w-[300px] sm:max-w-[350px] md:max-w-[360px] lg:max-w-[340px] xl:max-w-[360px] 2xl:max-w-[380px] mx-auto flex justify-center">
                <img src="/About/landscape-card.webp"
                  alt="Card background"
                  className="w-[300px] h-[240px] sm:w-[350px] sm:h-[280px] md:w-[360px] md:h-[288px] lg:w-[340px] lg:h-[272px] xl:w-[360px] xl:h-[288px] 2xl:w-[380px] 2xl:h-[304px] object-cover" loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                  <h3
                    className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                    style={{ color: "#A25B2B" }}
                  >
                    Comprehensive Concept Mastery
                  </h3>
                  <p
                    className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                    style={{
                      color: "#45290E",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Deep dive into mathematical concepts with interactive tools
                    and real-world applications
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="relative group w-full max-w-[300px] sm:max-w-[350px] md:max-w-[360px] lg:max-w-[340px] xl:max-w-[360px] 2xl:max-w-[380px] mx-auto flex justify-center">
                <img src="/About/landscape-card.webp"
                  alt="Card background"
                  className="w-[300px] h-[240px] sm:w-[350px] sm:h-[280px] md:w-[360px] md:h-[288px] lg:w-[340px] lg:h-[272px] xl:w-[360px] xl:h-[288px] 2xl:w-[380px] 2xl:h-[304px] object-cover" loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                  <h3
                    className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                    style={{ color: "#A25B2B" }}
                  >
                    Expert Guidance
                  </h3>
                  <p
                    className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                    style={{
                      color: "#45290E",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Learn from experienced math educators who provide
                    personalized support and mentorship
                  </p>
                </div>
              </div>

              {/* Card 5 */}
              <div className="relative group w-full max-w-[300px] sm:max-w-[350px] md:max-w-[360px] lg:max-w-[340px] xl:max-w-[360px] 2xl:max-w-[380px] mx-auto flex justify-center">
                <img src="/About/landscape-card.webp"
                  alt="Card background"
                  className="w-[300px] h-[240px] sm:w-[350px] sm:h-[280px] md:w-[360px] md:h-[288px] lg:w-[340px] lg:h-[272px] xl:w-[360px] xl:h-[288px] 2xl:w-[380px] 2xl:h-[304px] object-cover" loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                  <h3
                    className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                    style={{ color: "#A25B2B" }}
                  >
                    Interactive Learning Tools
                  </h3>
                  <p
                    className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                    style={{
                      color: "#45290E",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Engage with dynamic visualizations, simulations, and
                    hands-on activities that make math come alive
                  </p>
                </div>
              </div>

              {/* Card 6 */}
              <div className="relative group w-full max-w-[300px] sm:max-w-[350px] md:max-w-[360px] lg:max-w-[340px] xl:max-w-[360px] 2xl:max-w-[380px] mx-auto flex justify-center">
                <img src="/About/landscape-card.webp"
                  alt="Card background"
                  className="w-[300px] h-[240px] sm:w-[350px] sm:h-[280px] md:w-[360px] md:h-[288px] lg:w-[340px] lg:h-[272px] xl:w-[360px] xl:h-[288px] 2xl:w-[380px] 2xl:h-[304px] object-cover" loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                  <h3
                    className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                    style={{ color: "#A25B2B" }}
                  >
                    Progress Tracking
                  </h3>
                  <p
                    className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                    style={{
                      color: "#45290E",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Monitor your growth with detailed analytics and celebrate
                    milestones on your mathematical journey
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Section - Our Foundation */}
        <div className="w-full relative pt-0 pb-16 sm:pb-20 md:pb-24 lg:pb-32 xl:pb-40 2xl:pb-48">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            {/* Section Title */}
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h2
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-clash-bold leading-tight mb-2 sm:mb-3"
                style={{
                  color: "#FDCB3F",
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                }}
              >
                Our Foundation
              </h2>
              <div
                className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg font-clash text-white leading-relaxed max-w-4xl mx-auto text-center"
                style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
              >
                <p>Built on principles that drive excellence in</p>
                <p>mathematical education</p>
              </div>
            </div>

            {/* Desktop Layout - Hidden on mobile/tablet */}
            <div className="hidden lg:flex lg:items-center lg:justify-center">
              {/* Our Mission Card - Left */}
              <div className="relative flex-shrink-0 -mr-6 xl:-mr-8 2xl:-mr-10">
                <img src="/About/about-card-2.webp"
                  alt="Our Mission Card"
                  className="w-[320px] h-auto xl:w-[380px] 2xl:w-[420px] object-contain" loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-6 xl:p-8">
                  <h3
                    className="text-lg xl:text-xl 2xl:text-2xl font-clash-bold text-center mb-3 xl:mb-4 leading-tight"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    Our Mission
                  </h3>
                  <p
                    className="text-xs xl:text-sm 2xl:text-base font-clash text-center leading-relaxed"
                    style={{
                      color: "#F5F0E1",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    Customized curriculum that adapts to your unique learning
                    style, pace and goal for optimal understanding
                  </p>
                </div>
              </div>

              {/* Elf Character - Center */}
              <div className="flex-shrink-0 -mt-4 xl:-mt-6 2xl:-mt-8 relative z-10">
                <img src="/About/elf-character.webp"
                  alt="Elf Character"
                  className="w-[260px] h-auto xl:w-[320px] 2xl:w-[380px] object-contain" loading="lazy"
                />
              </div>

              {/* Our Vision Card - Right */}
              <div className="relative flex-shrink-0 -ml-6 xl:-ml-8 2xl:-ml-10">
                <img src="/About/about-card-2.webp"
                  alt="Our Vision Card"
                  className="w-[320px] h-auto xl:w-[380px] 2xl:w-[420px] object-contain" loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center p-6 xl:p-8">
                  <h3
                    className="text-lg xl:text-xl 2xl:text-2xl font-clash-bold text-center mb-3 xl:mb-4 leading-tight"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    Our Vision
                  </h3>
                  <p
                    className="text-xs xl:text-sm 2xl:text-base font-clash text-center leading-relaxed"
                    style={{
                      color: "#F5F0E1",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    Customized curriculum that adapts to your unique learning
                    style, pace and goal for optimal understanding
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile/Tablet Layout - Hidden on desktop */}
            <div className="lg:hidden flex flex-col items-center gap-6 sm:gap-8">
              {/* Elf Character - Top */}
              <div className="flex justify-center">
                <img src="/About/elf-character.webp"
                  alt="Elf Character"
                  className="w-[120px] h-auto sm:w-[140px] md:w-[160px] object-contain" loading="lazy"
                />
              </div>

              {/* Cards - Bottom */}
              <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-xs mx-auto px-4">
                {/* Our Vision Card */}
                <div className="relative w-full">
                  <img src="/About/about-card-2.webp"
                    alt="Our Vision Card"
                    className="w-full h-auto object-contain max-w-[280px] mx-auto" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5">
                    <h3
                      className="text-sm sm:text-base md:text-lg font-clash-bold text-center mb-2 sm:mb-3 leading-tight"
                      style={{
                        color: "#FDCB3F",
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      Our Vision
                    </h3>
                    <p
                      className="text-xs sm:text-sm font-clash text-center leading-relaxed"
                      style={{
                        color: "#F5F0E1",
                        fontFamily: '"ClashOfClans", sans-serif',
                      }}
                    >
                      Customized curriculum that adapts to your unique learning
                      style, pace and goal for optimal understanding
                    </p>
                  </div>
                </div>

                {/* Our Mission Card */}
                <div className="relative w-full">
                  <img src="/About/about-card-2.webp"
                    alt="Our Mission Card"
                    className="w-full h-auto object-contain max-w-[280px] mx-auto" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5">
                    <h3
                      className="text-sm sm:text-base md:text-lg font-clash-bold text-center mb-2 sm:mb-3 leading-tight"
                      style={{
                        color: "#FDCB3F",
                        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      Our Mission
                    </h3>
                    <p
                      className="text-xs sm:text-sm font-clash text-center leading-relaxed"
                      style={{
                        color: "#F5F0E1",
                        fontFamily: '"ClashOfClans", sans-serif',
                      }}
                    >
                      Customized curriculum that adapts to your unique learning
                      style, pace and goal for optimal understanding
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fourth Section - Master Math with Free Package */}
        <div className="w-full relative -mt-24 sm:-mt-28 md:-mt-32 lg:-mt-72 xl:-mt-80 2xl:-mt-96 pt-4 pb-8 sm:pt-6 sm:pb-12 md:pt-8 md:pb-16 lg:pt-10 lg:pb-20 xl:pt-12 xl:pb-24 2xl:pt-14 2xl:pb-28">
          {/* Desktop Layout */}
          <div className="hidden lg:block relative overflow-hidden">
            {/* Modern Card with Branches - Full Width */}
            <div className="relative w-full flex justify-center items-cente">
              <img src="/About/modern-card.webp"
                alt="Modern card with branches background"
                className="w-full h-auto object-contain"
                style={{
                  minHeight: "600px",
                }} loading="lazy"
              />

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-center items-center p-12 lg:p-16 xl:p-20 2xl:p-24">
                {/* Text Content */}
                <div
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{ top: "45%" }}
                >
                  {/* Main Heading */}
                  <h2
                    className="about-master-math-title text-4xl md:text-6xl lg:text-3xl 2xl:text-6xl font-clash-bold text-center md:mb-20 leading-tight"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "3px 3px 6px rgba(0, 0, 0, 0.8)",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    Master Math with our <br /> Free Package
                  </h2>

                  {/* Subtitle */}
                  <p
                    className="about-master-math-subtitle text-lg md:text-3xl lg:text-2xl 2xl:text-3xl font-clash text-center leading-relaxed max-w-2xl md:max-w-4xl lg:max-w-4xl mx-auto"
                    style={{
                      color: "white",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    Customized curriculum that adapts to your unique learning
                    style, pace and goal for optimal understanding
                  </p>
                </div>

                {/* Button */}
                <button
                  className="about-master-math-button mt-120 relative cursor-pointer hover:scale-105 transition-transform duration-200 2xl:mt-200"
                  style={{
                    marginBottom: "-2.5rem",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <img src="/About/modern-card-button.webp"
                    alt="Start Free Trial button"
                    className="w-auto h-auto max-w-[280px] md:max-w-[380px] lg:max-w-[360px]"
                    style={{ minWidth: "160px" }} loading="lazy"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden md:block lg:hidden relative overflow-hidden">
            {/* Tablet Modern Card - Full Width */}
            <div className="relative w-full">
              <img src="/About/modern-card.webp"
                alt="Modern card with branches background"
                className="w-full h-auto object-cover"
                style={{
                  minHeight: "500px",
                }} loading="lazy"
              />

              {/* Tablet Content Overlay - Responsive text and button sizing */}
              <div className="absolute inset-0 flex flex-col justify-center items-center p-6 md:p-8 gap-4">
                {/* Text Content - Smaller for large tablets */}
                <div
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{ top: "42%" }}
                >
                  {/* Main Heading */}
                  <h2
                    className="mt-2 text-2xl font-clash-bold text-center mb-1 leading-tight md:[min-height:1366px]:text-sm md:[min-width:1024px][max-height:600px]:text-sm"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    Master Math with our
                  </h2>
                  <h2
                    className="text-2xl font-clash-bold text-center mb-2 leading-tight md:[min-height:1366px]:text-sm md:[min-width:1024px][max-height:600px]:text-sm"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    Free Package
                  </h2>

                  {/* Subtitle */}
                  <p
                    className="text-lg font-clash text-center leading-relaxed max-w-lg mx-auto [min-width:780px][max-width:1024px]:text-lg"
                    style={{
                      color: "white",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    Customized curriculum that adapts to your unique learning
                    style, pace and goal for optimal understanding
                  </p>
                </div>

                {/* Button - Larger for all tablets, positioned lower */}
                <button
                  className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer hover:scale-105 transition-transform duration-200"
                  style={{
                    bottom: "2%",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <img src="/About/modern-card-button.webp"
                    alt="Start Free Trial button"
                    className="w-auto h-auto max-w-[200px] md:max-w-[240px]"
                    style={{ minWidth: "160px" }} loading="lazy"
                  />
                </button>
              </div>
            </div>
          </div>
          {/* Mobile Layout */}
          <div className="md:hidden relative overflow-hidden">
            <div className="relative w-full">
              <img src="/About/modern-card-mobile.webp"
                alt="Modern card mobile"
                className="w-full h-auto object-cover" loading="lazy"
              />

              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-6 gap-4 sm:mt-40 mt-30">
                {/* Text */}
                <div className="flex flex-col items-center text-center">
                  <h2
                    className="text-3xl font-clash-bold text-center mb-3 [@media(max-width:420px)]:text-2xl [@media(max-width:420px)]:mt-8"
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    Master Math
                  </h2>
                  <h2
                    className="text-2xl max-w-[200px] "
                    style={{
                      color: "#FDCB3F",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                      fontFamily: '"ClashOfClans", sans-serif',
                    }}
                  >
                    with our Free Package
                  </h2>
                  <p className="text-md font-clash text-white text-center max-w-[300px] sm:max-w-[320px] leading-relaxed mt-10 [@media(max-width:516px)]:max-w-[200px]">
                    Customized curriculum that adapts to your unique learning
                    style, pace and goal for optimal understanding
                  </p>
                </div>

                {/* Button */}
                <div className="mt-4 sm:mt-[-50px] [@media(max-width:420px)]:mt-[-60px] [@media(max-width:348px)]:mt-[-300px] ">
                  <img src="/About/modern-card-button.webp"
                    alt="Start Free Trial button"
                    className="w-auto h-auto max-w-[160px] sm:max-w-[200px]" loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fifth Section - What Our Students Say */}
        <div className="w-full relative py-16 sm:py-20 md:py-24 lg:py-4 xl:py-6 2xl:py-8">
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
            </div>

            {/* Desktop Layout - 3 cards in a row */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 xl:gap-6 2xl:gap-8 place-items-center">
              {/* Testimonial Card 1 */}
              <div className="relative w-500px max-w-[600px] xl:max-w-[750px] 2xl:max-w-[900px]">
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
          </div>
        </div>

        {/* Gap between section 5 and footer */}
        <div className="w-full py-8 lg:py-12 xl:py-16 2xl:py-20"></div>

        <LandingFooter />
      </div>
    </>
  );
}

export default LandingAbout;
