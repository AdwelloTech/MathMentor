import React from 'react';
import './Student.css';
import LandingFooter from '../../components/landing/LandingFooter';
import { LandingNavbar } from '../../components/landing/LandingNavbar';

const LandingStudent: React.FC = () => {
  // Parallax effect will be added back once background is confirmed working
  // useEffect(() => {
  //   const handleScroll = () => {
  //     const scrolled = window.pageYOffset;
  //     const parallax = document.querySelector('.student-page') as HTMLElement;
  //     if (parallax) {
  //       const speed = scrolled * 0.5;
  //       parallax.style.setProperty('--scroll-offset', `${-speed}px`);
  //     }
  //   };
  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  return (
    <>
      <LandingNavbar />
      <div className="student-page">
      {/* Hero Section */}
      <section className="relative w-full pt-0 sm:pt-0 md:pt-0 flex justify-center">
        {/* Background image (mobile) */}
        <img src="/student/mobileview.webp"
          alt="Math Learning Platform"
          className="w-full object-cover block md:hidden" loading="lazy"
        />

        {/* Background image (tablet/desktop) */}
        <img src="/student/Hero1.webp"
          alt="Math Learning Platform"
          className="w-full object-contain hidden md:block" loading="lazy"
        />

        {/* Overlay board (only >= md) */}
        <img src="/student/Hero2.webp"
          alt="Learn Math Smarter overlay"
          className="absolute bottom-[-2%] left-1/2 -translate-x-1/2 w-[90%] hidden md:block" loading="lazy"
        />

        {/* Text overlay */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none top-[15%] sm:top-[16%] md:top-[25%] w-[90%]">
          <p className="font-clash text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-4xl text-[#45290E] drop-shadow-md leading-tight mb-4 md:mb-6">
            Interactive lessons and<span className="hidden md:inline"> practice<br />designed for</span><span className="md:hidden"> practice designed for</span><br className="md:hidden" /> students.
          </p>

          <h1 className="Student-hero-title font-clash-bold text-4xl sm:text-5xl md:text-6xl lg:text-[12rem] xl:text-[14rem] text-[#45290E] leading-tight" style={{ textShadow: '2px 2px 4px #E49F56' }}>
            Learn&nbsp;Math<br className="md:hidden" /> Smarter
          </h1>
        </div>

        {/* Left sign-board */}
        <div className="absolute hidden md:block left-[9%] top-[63%] w-[28%] lg:w-[24%] text-center 2xl:text-4xl pointer-events-none">
          <p className="student-signs-text font-clash text-xs md:text-sm lg:text-lg xl:text-xl text-[#45290E] drop-shadow-md leading-tight">
            Access thousands of<br />lessons and practice<br />exercises tailored to<br />your grade and<br />skill level.
          </p>
        </div>

        {/* Right sign-board */}
        <div className="absolute hidden md:block right-[9%] top-[63%] w-[28%] lg:w-[24%] text-center pointer-events-none">
          <p className="student-signs-text font-clash text-xs md:text-sm lg:text-lg xl:text-xl text-[#45290E] drop-shadow-md leading-tight">
            Master math concepts<br />step by step with<br />expert-designed study<br />plans for better learning.
          </p>
        </div>
      </section>

      {/* Math Made Better Section */}
      <section className="relative w-full py-12 lg:py-20">
        {/* Background image - Desktop/Tablet only */}
        <img src="/student/MMB1.webp"
          alt="Math Made Better background"
          className="w-full h-auto object-contain hidden md:block" loading="lazy"
        />

        {/* Main heading + subtitle - Desktop/Tablet */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 text-center w-[90%] max-w-[800px] hidden md:block">
          <h2 className="font-clash-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-[#FDCB3F] drop-shadow-md uppercase mb-2 md:mb-3">
            Math Made Better
          </h2>
          <p className="font-clash text-sm sm:text-base md:text-lg lg:text-xl text-white drop-shadow-md">
            Enhance your learning with powerful tools and features
          </p>
        </div>

        {/* Mobile heading + subtitle */}
        <div className="text-center w-[90%] mx-auto md:hidden mb-8">
          <h2 className="font-clash-bold text-2xl text-[#FDCB3F] drop-shadow-md uppercase mb-2">
            Math Made Better
          </h2>
          <p className="font-clash text-sm text-white drop-shadow-md">
            Enhance your learning with powerful tools and features
          </p>
        </div>

        {/* Card grid (tablet / desktop) */}
        <div className="absolute top-[28%] md:top-[30%] left-1/2 -translate-x-1/2 w-[95%] hidden md:grid grid-cols-3 gap-6 md:gap-10 xl:gap-10 place-items-center max-w-[1500px]">
          {/* First row – 3 cards */}
          {[
            {
              title: 'Quizzes &\nPractice\nPapers',
              desc: 'Sharpen your skills\nwith curated tests\nand instant results.',
            },
            {
              title: 'Video\nLessons',
              desc: 'Learn from detailed,\nstep-by-step\ntutorials.',
            },
            {
              title: 'Progress\nTracking',
              desc: 'See your improvement\nover time with\nanalytics.',
            },
          ].map((c, i) => (
            <div key={i} className="relative w-full max-w-[260px] lg:max-w-[300px] xl:max-w-[340px] xl:scale-150
            ">
              <img src="/student/MMB2.webp" alt={c.title} className="w-full h-auto object-contain" loading="lazy" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h3 className="font-clash-bold text-xs sm:text-sm md:text-base lg:text-lg text-[#FFFFFF] leading-tight mb-5 whitespace-pre-line drop-shadow">
                  {c.title}
                </h3>
                <p className="font-inter text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-[#FFFFFF] leading-tight whitespace-pre-line">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}

          {/* Row 2 – 2 cards centered */}
          <div className="col-span-3 flex justify-center gap-8 w-full xl:scale-150 mt-20">
            <div className="relative justify-self-end max-w-[260px] lg:max-w-[300px] xl:max-w-[340px]">
              <img src="/student/MMB2.webp" alt="24/7 Access" className="w-full h-auto object-contain" loading="lazy" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h3 className="font-clash-bold text-xs sm:text-sm md:text-base lg:text-lg text-[#FFFFFF] leading-tight mb-5 whitespace-pre-line drop-shadow">
                  {`24/7\nAccess`}
                </h3>
                <p className="font-inter text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-[#FFFFFF] leading-tight whitespace-pre-line">
                  {`Study anytime,\nfrom any\ndevice.`}
                </p>
              </div>
            </div>
            <div className="relative justify-self-start max-w-[260px] lg:max-w-[300px] xl:max-w-[340px]">
              <img src="/student/MMB2.webp" alt="Community Support" className="w-full h-auto object-contain" loading="lazy" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h3 className="font-clash-bold text-xs sm:text-sm md:text-base lg:text-lg text-[#FFFFFF] leading-tight mb-5 whitespace-pre-line drop-shadow">
                  {`Community\nSupport`}
                </h3>
                <p className="font-inter text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-[#FFFFFF] leading-tight whitespace-pre-line">
                  {`Get help from peers\nand expert\nmentors.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile card stack */}
        <div className="flex flex-col gap-6 items-center w-[92%] mx-auto md:hidden mt-10">
          {[
            'Quizzes &\nPractice\nPapers',
            'Video\nLessons',
            'Progress\nTracking',
            '24/7\nAccess',
            'Community\nSupport',
          ].map((t, i) => (
            <div key={i} className="relative w-full max-w-[260px]">
              <img src="/student/MMB2.webp" alt={t} className="w-full h-auto object-contain" loading="lazy" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h3 className="font-clash-bold text-sm text-[#FFFFFF] leading-tight whitespace-pre-line">
                  {t}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Section with section3.png */}
      <section className="w-full relative py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
        <img src="/student/section3.webp"
          alt="Section 3"
          className="w-full h-auto object-cover" loading="lazy"
        />
      </section>

      {/* Plans That Work for You Section */}
      <section className="w-full relative pt-6 sm:pt-8 md:pt-10 lg:pt-12 xl:pt-14 2xl:pt-16 pb-6">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 text-center mb-0">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-clash-bold leading-tight mb-2 sm:mb-3"
            style={{ color: '#FDCB3F', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            Plans That Work for You
          </h2>
          <p
            className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg font-clash text-white leading-relaxed max-w-4xl mx-auto"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            No hidden fees, just clear and simple learning options.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="w-full mt-8 md:mt-12 lg:mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 w-[95%] mx-auto">
            {/* Free Plan Card */}
            <div className="relative w-full flex justify-center items-center">
              <img src="/student/WFU1.webp" alt="Free Plan" className="w-full h-auto object-contain transition-transform duration-300 hover:transform hover:translate-y-[-5px]" loading="lazy" />
              <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[80%] max-w-[400px] flex flex-col items-center">
                <h3 className="font-clash-bold text-white mb-10 text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Free Plan</h3>
                <p className="font-clash text-[#FDCB3F] mb-3 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  Perfect for<br className="hidden sm:block md:block lg:hidden xl:hidden" /> getting started
                </p>
                <div className="flex items-baseline justify-center mb-3">
                  <span className="font-clash-bold text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-3xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>$0</span>
                  <span className="font-clash text-[#FDCB3F] ml-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>/MONTH</span>
                </div>
                <p className="font-clash text-white mb-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Forever free</p>
                <ul className="list-none p-0 m-0 text-center w-full">
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Up to 3 projects
                  </li>
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Basic templates
                  </li>
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Community support
                  </li>
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>1GB storage
                  </li>
                  <li className="font-clash text-gray-400 opacity-50 mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-gray-500 font-bold mr-1">✗</span>Priority support
                  </li>
                  <li className="font-clash text-gray-400 opacity-50 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-gray-500 font-bold mr-1">✗</span>Advanced analytics
                  </li>
                </ul>
              </div>
              <a href="/register" className="plan-btn absolute bottom-[20.5%] left-[49%] text-white font-clash-bold cursor-pointer text-xs sm:text-sm md:text-base lg:text-lg xl:text-base hover:text-yellow-300 transition-colors" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)', transform: 'translateX(-50%)', pointerEvents: 'auto', zIndex: 5 }}>Get Started Free</a>
            </div>
            {/* Standard Plan Card */}
            <div className="relative w-full flex justify-center items-center">
              <img src="/student/WFU2.webp" alt="Standard Plan" className="w-full h-auto object-contain transition-transform duration-300 hover:transform hover:translate-y-[-5px]" loading="lazy" />
              <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[80%] max-w-[400px] flex flex-col items-center">
                <h3 className="font-clash-bold text-white mb-10 text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Standard Plan</h3>
                <p className="font-clash text-[#FDCB3F] mb-3 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>More features to grow</p>
                <div className="flex items-baseline justify-center mb-3">
                  <span className="font-clash-bold text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-3xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>$29</span>
                  <span className="font-clash text-[#FDCB3F] ml-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>/MONTH</span>
                </div>
                <p className="font-clash text-white mb-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Unlimited projects</p>
                <ul className="list-none p-0 m-0 text-center w-full">
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Everything in Free
                  </li>
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Advanced templates
                  </li>
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Priority support
                  </li>
                  <li className="font-clash text-gray-400 opacity-50 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-gray-500 font-bold mr-1">✗</span>Advanced analytics
                  </li>
                </ul>
              </div>
              <a href="/register" className="plan-btn absolute bottom-[20.5%] left-[50%] text-white font-clash-bold cursor-pointer text-xs sm:text-sm md:text-base lg:text-lg xl:text-base hover:text-yellow-300 transition-colors" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)', transform: 'translateX(-50%)', pointerEvents: 'auto', zIndex: 5 }}>Choose Standard</a>
            </div>
            {/* Premium Plan Card */}
            <div className="relative w-full flex justify-center items-center">
              <img src="/student/WFU3.webp" alt="Premium Plan" className="w-full h-auto object-contain transition-transform duration-300 hover:transform hover:translate-y-[-5px]" loading="lazy" />
              <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[80%] max-w-[280px] flex flex-col items-center">
                <h3 className="font-clash-bold text-white mb-10 text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>Premium Plan</h3>
                <p className="font-clash text-[#FDCB3F] mb-3 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>All features unlocked</p>
                <div className="flex items-baseline justify-center mb-3">
                  <span className="font-clash-bold text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-3xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>$49</span>
                  <span className="font-clash text-[#FDCB3F] ml-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>/MONTH</span>
                </div>
                <p className="font-clash text-white mb-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Advanced analytics</p>
                <ul className="list-none p-0 m-0 text-center w-full">
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Everything in Standard
                  </li>
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Advanced analytics
                  </li>
                  <li className="font-clash text-white mb-1 text-xs sm:text-sm md:text-base lg:text-lg xl:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <span className="text-green-500 font-bold mr-1">✓</span>Dedicated support
                  </li>
                </ul>
              </div>
              <a href="/register" className="plan-btn absolute bottom-[20.5%] left-[55%] text-white font-clash-bold cursor-pointer text-xs sm:text-sm md:text-base lg:text-lg xl:text-base hover:text-yellow-300 transition-colors" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)', transform: 'translateX(-50%)', pointerEvents: 'auto', zIndex: 5 }}>Go Premium</a>
            </div>
          </div>
        </div>
      </section>

        {/* Gap between sections and footer */}
        <div className="w-full py-8 lg:py-12 xl:py-16 2xl:py-20"></div>

        <LandingFooter />
      </div>
    </>
  );
};
  
  export default LandingStudent;
