import LandingFooter from "../../components/landing/LandingFooter";
import { LandingNavbar } from "../../components/landing/LandingNavbar";

function LandingTutor() {
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
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none hidden lg:block">
          <img src="/tutor/tutor-branch.webp"
            alt="Branch decoration"
            className="absolute top-0 right-0 w-auto h-auto max-w-[280px] sm:max-w-[370px] md:max-w-[460px] lg:max-w-[540px] xl:max-w-[600px] 2xl:max-w-[680px]"
            style={{ zIndex: 1 }} loading="lazy"
          />
        </div>

        {/* Content wrapper */}
        <div className="flex flex-col items-center justify-start h-full relative z-10 px-4 sm:px-6 xl:flex-row xl:items-center xl:justify-center xl:gap-16 xl:px-0 xl:max-w-[1200px] xl:mx-auto 2xl:max-w-[1300px]">
          {/* Wizard Boy illustration */}
          <div
            className="pointer-events-none order-2 mt-8 xl:order-2 xl:mt-6 xl:relative xl:-ml-32 2xl:-ml-44"
            style={{
              zIndex: 50,
            }}
          >
            <img src="/tutor/wizard-boy.webp"
              alt="Wizard boy character"
              className="w-auto h-auto max-h-[360px] sm:max-h-[420px] md:max-h-[500px] xl:max-h-[620px] 2xl:max-h-[730px] 3xl:max-h-[840px]" loading="lazy"
            />
          </div>

          {/* Hero Card */}
          <div
            className="relative order-1 xl:order-1 xl:flex-shrink-0 xl:mt-0 xl:ml-0 2xl:ml-4"
            style={{ zIndex: 1 }}
          >
            <img src="/tutor/tutor-hero-card.webp"
              alt="Tutor hero card"
              className="w-full max-w-[340px] sm:max-w-[450px] md:max-w-[520px] xl:max-w-[580px] 2xl:max-w-[640px] 3xl:max-w-[700px]" loading="lazy"
            />

            <div className="absolute inset-0 flex flex-col justify-center items-center px-3 sm:px-4 md:px-6 mt-48 sm:mt-52 md:mt-64 lg:mt-60 xl:mt-80 2xl:mt-80">
              {/* Top text */}
              <div className="text-center mb-2 sm:mb-3 md:mb-4 xl:mb-3 2xl:mb-4">
                <p
                  className="text-sm sm:text-base md:text-lg xl:text-lg 2xl:text-2xl 3xl:text-3xl font-clash leading-tight drop-shadow-lg"
                  style={{ color: "#45290E" }}
                >
                  SHARE KNOwledge. Make
                </p>
                <p
                  className="text-sm sm:text-base md:text-lg xl:text-lg 2xl:text-2xl 3xl:text-3xl font-clash leading-tight drop-shadow-lg"
                  style={{ color: "#45290E" }}
                >
                  impact. Get Rewarded.
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
                  Teach. Inspire.
                </p>
                <p
                  className="text-xl sm:text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl font-clash-bold leading-tight"
                  style={{
                    color: "#FDCB3F",
                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  EARN
                </p>
              </div>

              {/* Bottom text */}
              <div className="text-center space-y-0.5 md:space-y-1 xl:space-y-0.5 2xl:space-y-1">
                <p
                  className="text-sm sm:text-base md:text-base xl:text-base 2xl:text-lg 3xl:text-xl font-clash text-white leading-tight"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  Empower students with YOUR
                </p>
                <p
                  className="text-sm sm:text-base md:text-base xl:text-base 2xl:text-lg 3xl:text-xl font-clash text-white leading-tight"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  knowledge while building
                </p>
                <p
                  className="text-sm sm:text-base md:text-base xl:text-base 2xl:text-lg 3xl:text-xl font-clash text-white leading-tight"
                  style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
                >
                  YOUR tutoring Career Online.
                </p>
              </div>

              {/* Button */}
              <div
                className="mt-4 sm:mt-6 md:mt-14 lg:mt-8 xl:mt-10 2xl:mt-12"
                style={{ transform: "translateY(-30px)" }}
              >
                <img
                  src="/tutor/tutor-hero-button.webp"
                  alt="Become a Tutor button"
                  className="w-auto h-auto max-w-[180px] sm:max-w-[220px] md:max-w-[260px] xl:max-w-[300px] 2xl:max-w-[340px] cursor-pointer hover:scale-105 transition-transform duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Second Section */}
        <div className="w-full relative pt-12 sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28 2xl:pt-32 pb-8 sm:pb-10 md:pb-12 lg:pb-16 xl:pb-20 2xl:pb-24">
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
                YOUR PROVIDED POINTS Expanded
              </h2>
              <p
                className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg font-clash text-white leading-relaxed max-w-4xl mx-auto"
                style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
              >
                Powerful Tools for Tutors
              </p>
            </div>

            {/* Cards Grid - Responsive layout for 5 cards (3+2) */}
            <div className="space-y-8 lg:space-y-12">
              {/* First Row - 3 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 place-items-center justify-items-center">
                {/* Card 1 - Create & Check Quizzes */}
                <div className="relative group w-full max-w-[320px] sm:max-w-[370px] md:max-w-[390px] lg:max-w-[370px] xl:max-w-[350px] 2xl:max-w-[370px] mx-auto flex justify-center">
                  <img src="/tutor/tutor-points-card.webp"
                    alt="Card background"
                    className="w-[320px] h-[256px] sm:w-[370px] sm:h-[296px] md:w-[390px] md:h-[312px] lg:w-[370px] lg:h-[296px] xl:w-[350px] xl:h-[280px] 2xl:w-[370px] 2xl:h-[296px] object-cover" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                    <h3
                      className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                      style={{ color: "#A25B2B" }}
                    >
                      Create & Check Quizzes
                    </h3>
                    <p
                      className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                      style={{
                        color: "#45290E",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Manage and grade quizzes with ease. Save time with
                      automated results
                    </p>
                  </div>
                </div>

                {/* Card 2 - Host Online Classes */}
                <div className="relative group w-full max-w-[320px] sm:max-w-[370px] md:max-w-[390px] lg:max-w-[370px] xl:max-w-[350px] 2xl:max-w-[370px] mx-auto flex justify-center">
                  <img src="/tutor/tutor-points-card.webp"
                    alt="Card background"
                    className="w-[320px] h-[256px] sm:w-[370px] sm:h-[296px] md:w-[390px] md:h-[312px] lg:w-[370px] lg:h-[296px] xl:w-[350px] xl:h-[280px] 2xl:w-[370px] 2xl:h-[296px] object-cover" loading="lazy"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                    <h3
                      className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                      style={{ color: "#A25B2B" }}
                    >
                      Host Online Classes
                    </h3>
                    <p
                      className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                      style={{
                        color: "#45290E",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Use interactive whiteboard and screen-sharing tools to
                      make classes engaging and effective.
                    </p>
                  </div>
                </div>

                {/* Card 3 - Progress Tracking */}
                <div className="relative group w-full max-w-[320px] sm:max-w-[370px] md:max-w-[390px] lg:max-w-[370px] xl:max-w-[350px] 2xl:max-w-[370px] mx-auto flex justify-center">
                  <img src="/tutor/tutor-points-card.webp"
                    alt="Card background"
                    className="w-[320px] h-[256px] sm:w-[370px] sm:h-[296px] md:w-[390px] md:h-[312px] lg:w-[370px] lg:h-[296px] xl:w-[350px] xl:h-[280px] 2xl:w-[370px] 2xl:h-[296px] object-cover" loading="lazy"
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
                      See your improvement over time with analytics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Second Row - 2 Cards Centered */}
              <div className="flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 place-items-center justify-items-center w-full md:w-2/3 lg:w-2/3">
                  {/* Card 4 - Earn by Teaching */}
                  <div className="relative group w-full max-w-[320px] sm:max-w-[370px] md:max-w-[390px] lg:max-w-[370px] xl:max-w-[350px] 2xl:max-w-[370px] mx-auto flex justify-center">
                    <img src="/tutor/tutor-points-card.webp"
                      alt="Card background"
                      className="w-[320px] h-[256px] sm:w-[370px] sm:h-[296px] md:w-[390px] md:h-[312px] lg:w-[370px] lg:h-[296px] xl:w-[350px] xl:h-[280px] 2xl:w-[370px] 2xl:h-[296px] object-cover" loading="lazy"
                    />
                    <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                      <h3
                        className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                        style={{ color: "#A25B2B" }}
                      >
                        Earn by Teaching
                      </h3>
                      <p
                        className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                        style={{
                          color: "#45290E",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Enjoy flexible tutoring options with competitive
                        payouts, on your schedule.
                      </p>
                    </div>
                  </div>

                  {/* Card 5 - Messaging & Chat Support */}
                  <div className="relative group w-full max-w-[320px] sm:max-w-[370px] md:max-w-[390px] lg:max-w-[370px] xl:max-w-[350px] 2xl:max-w-[370px] mx-auto flex justify-center">
                    <img src="/tutor/tutor-points-card.webp"
                      alt="Card background"
                      className="w-[320px] h-[256px] sm:w-[370px] sm:h-[296px] md:w-[390px] md:h-[312px] lg:w-[370px] lg:h-[296px] xl:w-[350px] xl:h-[280px] 2xl:w-[370px] 2xl:h-[296px] object-cover" loading="lazy"
                    />
                    <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
                      <h3
                        className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl font-clash-bold text-center mb-2 sm:mb-3 md:mb-4 leading-tight"
                        style={{ color: "#A25B2B" }}
                      >
                        Messaging & Chat Support
                      </h3>
                      <p
                        className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base font-sans text-center leading-relaxed"
                        style={{
                          color: "#45290E",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Stay connected with students through built-in chat for
                        guidance and support.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Section - Plans That Work for You */}
        <div className="w-full relative pt-6 sm:pt-8 md:pt-10 lg:pt-12 xl:pt-14 2xl:pt-16 pb-2 sm:pb-3 md:pb-4 lg:pb-6 xl:pb-8 2xl:pb-10">
          {/* Section Title */}
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 text-center mb-0">
            <h2
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-clash-bold leading-tight mb-2 sm:mb-3"
              style={{
                color: "#FDCB3F",
                textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
              Plans That Work for You
            </h2>
            <p
              className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg font-clash text-white leading-relaxed max-w-4xl mx-auto"
              style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}
            >
              No hidden fees, just clear and simple learning options
            </p>
          </div>

          {/* Plans Image */}
          <div className="w-full -mt-20 sm:-mt-24 md:-mt-32 lg:-mt-40 xl:-mt-48 relative">
            {/* Mobile Image */}
            <img src="/tutor/tutor-plans-that-work-mobile.webp"
              alt="Plans That Work for You"
              className="w-full h-auto sm:hidden" loading="lazy"
            />

            {/* Desktop Image */}
            <img src="/tutor/tutor-plans-that-work.webp"
              alt="Plans That Work for You"
              className="hidden sm:block w-full h-auto" loading="lazy"
            />

            {/* Text Overlays for Mobile */}
            <div className="sm:hidden absolute inset-0">
              {/* Sign Up - Top Left */}
              <div className="absolute top-[17%] left-[28%] w-[45%] h-[22%] flex flex-col justify-center items-center p-1">
                <h3
                  className="text-base font-clash-bold text-center mb-1"
                  style={{ color: "#A25B2B" }}
                >
                  Sign Up
                </h3>
                <p
                  className="text-[11px] font-sans text-center leading-tight"
                  style={{ color: "#45290E", fontFamily: "Inter, sans-serif" }}
                >
                  Join our community in minutes by creating your free tutor
                  profile. Highlight your skills, set your subjects and
                  availability, and let students discover you easily.
                </p>
              </div>

              {/* Teach Online - Top Right */}
              <div className="absolute top-[40%] right-[28%] w-[45%] h-[22%] flex flex-col justify-center items-center p-1">
                <h3
                  className="text-base font-clash-bold text-center mb-1"
                  style={{ color: "#A25B2B" }}
                >
                  Teach Online
                </h3>
                <p
                  className="text-[11px] font-sans text-center leading-tight"
                  style={{ color: "#45290E", fontFamily: "Inter, sans-serif" }}
                >
                  Engage students with interactive online classes, quizzes, and
                  assignments. Customize your lessons, track progress, and make
                  learning fun and effective from anywhere.
                </p>
              </div>

              {/* Get Paid - Bottom Center */}
              <div className="absolute bottom-[13%] left-1/2 transform -translate-x-1/2 w-[45%] h-[22%] flex flex-col justify-center items-center p-1">
                <h3
                  className="text-base font-clash-bold text-center mb-1"
                  style={{ color: "#A25B2B" }}
                >
                  Get Paid
                </h3>
                <p
                  className="text-[11px] font-sans text-center leading-tight"
                  style={{ color: "#45290E", fontFamily: "Inter, sans-serif" }}
                >
                  Earn confidently with our secure, hassle-free payout system.
                  Get paid promptly for every session you conduct, with full
                  transparency and easy tracking of your earnings.
                </p>
              </div>
            </div>

            {/* Text Overlays for Desktop */}
            <div className="hidden sm:block absolute inset-0">
              {/* Sign Up - Top Left */}
              <div className="absolute top-[34%] left-[12%] w-[28%] h-[24%] flex flex-col justify-center items-center p-2">
                <h3
                  className="text-xs sm:text-sm md:text-base lg:text-2xl xl:text-3xl 2xl:text-6xl font-clash-bold text-center mb-10"
                  style={{ color: "#A25B2B" }}
                >
                  Sign Up
                </h3>
                <p
                  className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-sm xl:text-base 2xl:text-xl font-clash text-center leading-relaxed"
                  style={{ color: "#45290E" }}
                >
                  Join our community in minutes by creating your free tutor
                  profile. Highlight your skills, set your subjects and
                  availability, and let students discover you easily.
                </p>
              </div>

              {/* Teach Online - Top Right */}
              <div className="absolute top-[42%] right-[12%] w-[28%] h-[24%] flex flex-col justify-center items-center p-2">
                <h3
                  className="text-xs sm:text-sm md:text-base lg:text-2xl xl:text-3xl 2xl:text-6xl font-clash-bold text-center mb-10"
                  style={{ color: "#A25B2B" }}
                >
                  Teach Online
                </h3>
                <p
                  className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-sm xl:text-base 2xl:text-xl font-clash text-center leading-relaxed"
                  style={{ color: "#45290E" }}
                >
                  Engage students with interactive online classes, quizzes, and
                  assignments. Customize your lessons, track progress, and make
                  learning fun and effective from anywhere.
                </p>
              </div>

              {/* Get Paid - Bottom Center */}
              <div className="absolute bottom-[13.5%] left-[12%] w-[28%] h-[24%] flex flex-col justify-center items-center p-2">
                <h3
                  className="text-xs sm:text-sm md:text-base lg:text-2xl xl:text-3xl 2xl:text-6xl font-clash-bold text-center mb-10"
                  style={{ color: "#A25B2B" }}
                >
                  Get Paid
                </h3>
                <p
                  className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-sm xl:text-base 2xl:text-xl font-clash text-center leading-relaxed"
                  style={{ color: "#45290E" }}
                >
                  Earn confidently with our secure, hassle-free payout system.
                  Get paid promptly for every session you conduct, with full
                  transparency and easy tracking of your earnings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fourth Section - What Tutors Say */}
        <div className="w-full relative pt-0 sm:pt-0 md:pt-0 lg:pt-0 xl:pt-0 2xl:pt-0 pb-16 sm:pb-20 md:pb-24">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            {/* Section Title */}
            <div className="text-center mb-20 sm:mb-24 md:mb-28 lg:mb-16 xl:mb-20">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-clash-bold leading-tight mb-2 sm:mb-3 md:mb-4"
                style={{ color: "#FDCB3F", textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)", fontFamily: '"ClashOfClans", sans-serif' }}
              >
                What Tutors Say
              </h2>
            </div>

            {/* Desktop Layout - 3 cards in a row */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 xl:gap-6 2xl:gap-8 place-items-center">
              {/* Testimonial Card 1 */}
              <div className="relative w-full max-w-[600px] xl:max-w-[750px] 2xl:max-w-[900px]">
                <img src="/tutor/tutor-rating-card.webp" alt="Tutor testimonial card" className="w-full h-auto object-contain scale-110 xl:scale-125 2xl:scale-140" loading="lazy" />
                {/* Rating Circle */}
                <div className="absolute -top-20 xl:-top-18 2xl:-top-16 left-1/2 transform -translate-x-1/2 z-10">
                  <img src="/tutor/tutor-rating-circle.webp" alt="Rating circle" className="w-40 h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48" loading="lazy" />
                </div>
                {/* Profile Image */}
                <div className="absolute -top-14 xl:-top-12 2xl:-top-10 left-1/2 transform -translate-x-1/2 w-28 h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 rounded-full overflow-hidden z-20">
                  <img src="/tutor/tutor-rating-image.webp" alt="Tutor profile" className="w-full h-full object-cover" loading="lazy" />
                </div>
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-center items-center px-10 xl:px-12 2xl:px-16 pt-24 xl:pt-28 2xl:pt-32 pb-12 xl:pb-16 2xl:pb-20">
                  <h3 className="text-base xl:text-lg 2xl:text-xl font-clash-bold text-center mb-2 xl:mb-3 2xl:mb-4" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}>Sajad AHamed</h3>
                  <div className="flex justify-center mb-3 xl:mb-4 2xl:mb-5">{[...Array(5)].map((_, i) => (<span key={i} className="text-yellow-500 text-xl xl:text-2xl 2xl:text-3xl mx-0.5">★</span>))}</div>
                  <p className="text-xs xl:text-sm 2xl:text-base font-clash text-center leading-relaxed" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)" }}>Join our community in minutes by creating your free tutor profile. Highlight your skills, set your subjects</p>
                </div>
              </div>

              {/* Testimonial Card 2 */}
              <div className="relative w-full max-w-[600px] xl:max-w-[750px] 2xl:max-w-[900px]">
                <img src="/tutor/tutor-rating-card.webp" alt="Tutor testimonial card" className="w-full h-auto object-contain scale-110 xl:scale-125 2xl:scale-140" loading="lazy" />
                <div className="absolute -top-20 xl:-top-18 2xl:-top-16 left-1/2 transform -translate-x-1/2 z-10">
                  <img src="/tutor/tutor-rating-circle.webp" alt="Rating circle" className="w-40 h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48" loading="lazy" />
                </div>
                <div className="absolute -top-14 xl:-top-12 2xl:-top-10 left-1/2 transform -translate-x-1/2 w-28 h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 rounded-full overflow-hidden z-20">
                  <img src="/tutor/tutor-rating-image.webp" alt="Tutor profile" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center items-center px-10 xl:px-12 2xl:px-16 pt-24 xl:pt-28 2xl:pt-32 pb-12 xl:pb-16 2xl:pb-20">
                  <h3 className="text-base xl:text-lg 2xl:text-xl font-clash-bold text-center mb-2 xl:mb-3 2xl:mb-4" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}>Sajad AHamed</h3>
                  <div className="flex justify-center mb-3 xl:mb-4 2xl:mb-5">{[...Array(5)].map((_, i) => (<span key={i} className="text-yellow-500 text-xl xl:text-2xl 2xl:text-3xl mx-0.5">★</span>))}</div>
                  <p className="text-xs xl:text-sm 2xl:text-base font-clash text-center leading-relaxed" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)" }}>Join our community in minutes by creating your free tutor profile. Highlight your skills, set your subjects</p>
                </div>
              </div>

              {/* Testimonial Card 3 */}
              <div className="relative w-full max-w-[600px] xl:max-w-[750px] 2xl:max-w-[900px]">
                <img src="/tutor/tutor-rating-card.webp" alt="Tutor testimonial card" className="w-full h-auto object-contain scale-110 xl:scale-125 2xl:scale-140" loading="lazy" />
                <div className="absolute -top-20 xl:-top-18 2xl:-top-16 left-1/2 transform -translate-x-1/2 z-10">
                  <img src="/tutor/tutor-rating-circle.webp" alt="Rating circle" className="w-40 h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48" loading="lazy" />
                </div>
                <div className="absolute -top-14 xl:-top-12 2xl:-top-10 left-1/2 transform -translate-x-1/2 w-28 h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 rounded-full overflow-hidden z-20">
                  <img src="/tutor/tutor-rating-image.webp" alt="Tutor profile" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center items-center px-10 xl:px-12 2xl:px-16 pt-24 xl:pt-28 2xl:pt-32 pb-12 xl:pb-16 2xl:pb-20">
                  <h3 className="text-base xl:text-lg 2xl:text-xl font-clash-bold text-center mb-2 xl:mb-3 2xl:mb-4" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}>Sajad AHamed</h3>
                  <div className="flex justify-center mb-3 xl:mb-4 2xl:mb-5">{[...Array(5)].map((_, i) => (<span key={i} className="text-yellow-500 text-xl xl:text-2xl 2xl:text-3xl mx-0.5">★</span>))}</div>
                  <p className="text-xs xl:text-sm 2xl:text-base font-clash text-center leading-relaxed" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)" }}>Join our community in minutes by creating your free tutor profile. Highlight your skills, set your subjects</p>
                </div>
              </div>
            </div>

            {/* Mobile Layout - Single column */}
            <div className="lg:hidden flex flex-col items-center gap-24 sm:gap-28 md:gap-28">
              {/* Testimonial Card 1 */}
              <div className="relative w-full max-w-[500px] sm:max-w-[600px] md:max-w-[480px]">
                <img src="/tutor/tutor-rating-card.webp" alt="Tutor testimonial card" className="w-full h-auto object-contain scale-135 sm:scale-150 md:scale-125" loading="lazy" />
                <div className="absolute -top-13 sm:-top-12 md:-top-10 left-1/2 transform -translate-x-1/2 z-10">
                  <img src="/tutor/tutor-rating-circle.webp" alt="Rating circle" className="w-44 h-44 sm:w-48 sm:h-48 md:w-40 md:h-40" loading="lazy" />
                </div>
                <div className="absolute -top-7 sm:-top-6 md:-top-5 left-1/2 transform -translate-x-1/2 w-32 h-32 sm:w-32 sm:h-32 md:w-28 md:h-28 rounded-full overflow-hidden z-20">
                  <img src="/tutor/tutor-rating-image.webp" alt="Tutor profile" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center items-center px-6 sm:px-8 md:px-6 pt-20 sm:pt-24 md:pt-20 pb-10 sm:pb-12 md:pb-10">
                  <h3 className="text-base sm:text-base md:text-lg font-clash-bold text-center mb-2 sm:mb-3 md:mb-2" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}>Sajad AHamed</h3>
                  <div className="flex justify-center mb-3 sm:mb-4 md:mb-3">{[...Array(5)].map((_, i) => (<span key={i} className="text-yellow-500 text-lg sm:text-lg md:text-xl mx-0.5">★</span>))}</div>
                  <p className="text-sm sm:text-sm md:text-sm font-clash text-center leading-relaxed" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)" }}>Join our community in minutes by creating your free tutor profile. Highlight your skills, set your subjects</p>
                </div>
              </div>

              {/* Testimonial Card 2 */}
              <div className="relative w-full max-w-[500px] sm:max-w-[600px] md:max-w-[480px]">
                <img src="/tutor/tutor-rating-card.webp" alt="Tutor testimonial card" className="w-full h-auto object-contain scale-135 sm:scale-150 md:scale-125" loading="lazy" />
                <div className="absolute -top-13 sm:-top-12 md:-top-10 left-1/2 transform -translate-x-1/2 z-10">
                  <img src="/tutor/tutor-rating-circle.webp" alt="Rating circle" className="w-44 h-44 sm:w-48 sm:h-48 md:w-40 md:h-40" loading="lazy" />
                </div>
                <div className="absolute -top-7 sm:-top-6 md:-top-5 left-1/2 transform -translate-x-1/2 w-32 h-32 sm:w-32 sm:h-32 md:w-28 md:h-28 rounded-full overflow-hidden z-20">
                  <img src="/tutor/tutor-rating-image.webp" alt="Tutor profile" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center items-center px-6 sm:px-8 md:px-6 pt-20 sm:pt-24 md:pt-20 pb-10 sm:pb-12 md:pb-10">
                  <h3 className="text-base sm:text-base md:text-lg font-clash-bold text-center mb-2 sm:mb-3 md:mb-2" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}>Sajad AHamed</h3>
                  <div className="flex justify-center mb-3 sm:mb-4 md:mb-3">{[...Array(5)].map((_, i) => (<span key={i} className="text-yellow-500 text-lg sm:text-lg md:text-xl mx-0.5">★</span>))}</div>
                  <p className="text-sm sm:text-sm md:text-sm font-clash text-center leading-relaxed" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)" }}>Join our community in minutes by creating your free tutor profile. Highlight your skills, set your subjects</p>
                </div>
              </div>

              {/* Testimonial Card 3 */}
              <div className="relative w-full max-w-[500px] sm:max-w-[600px] md:max-w-[480px]">
                <img src="/tutor/tutor-rating-card.webp" alt="Tutor testimonial card" className="w-full h-auto object-contain scale-135 sm:scale-150 md:scale-125" loading="lazy" />
                <div className="absolute -top-13 sm:-top-12 md:-top-10 left-1/2 transform -translate-x-1/2 z-10">
                  <img src="/tutor/tutor-rating-circle.webp" alt="Rating circle" className="w-44 h-44 sm:w-48 sm:h-48 md:w-40 md:h-40" loading="lazy" />
                </div>
                <div className="absolute -top-7 sm:-top-6 md:-top-5 left-1/2 transform -translate-x-1/2 w-32 h-32 sm:w-32 sm:h-32 md:w-28 md:h-28 rounded-full overflow-hidden z-20">
                  <img src="/tutor/tutor-rating-image.webp" alt="Tutor profile" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center items-center px-6 sm:px-8 md:px-6 pt-20 sm:pt-24 md:pt-20 pb-10 sm:pb-12 md:pb-10">
                  <h3 className="text-base sm:text-base md:text-lg font-clash-bold text-center mb-2 sm:mb-3 md:mb-2" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)" }}>Sajad AHamed</h3>
                  <div className="flex justify-center mb-3 sm:mb-4 md:mb-3">{[...Array(5)].map((_, i) => (<span key={i} className="text-yellow-500 text-lg sm:text-lg md:text-xl mx-0.5">★</span>))}</div>
                  <p className="text-sm sm:text-sm md:text-sm font-clash text-center leading-relaxed" style={{ color: "white", fontFamily: '"ClashOfClans", sans-serif', textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)" }}>Join our community in minutes by creating your free tutor profile. Highlight your skills, set your subjects</p>
                </div>
              </div>
            </div>
          </div>
        </div>
          {/* Gap between sections */}
        <div className="w-full py-8 lg:py-12 xl:py-16 2xl:py-20"></div>

        <LandingFooter />
      </div>
    </>
  );
}

export default LandingTutor;
