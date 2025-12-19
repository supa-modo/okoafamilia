import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TbArrowRight, TbCheck } from "react-icons/tb";
import Layout from "../components/Layout";
import { FiCheckCircle } from "react-icons/fi";
import LaptopMockup from "../components/ui/LaptopMockup";

const LandingPage = () => {
  const benefits = [
    {
      title: "Huduma ya Hospitali",
      description:
        "Matibabu bora ya hospitali - Comprehensive Inpatient & Outpatient cover",
    },
    {
      title: "Ulinzi Bora kwa Watu Saba",
      description:
        "Protect yourself, spouse and up to 6 children all under one insurance cover",
    },
    {
      title: "Bei Nafuu",
      description:
        "Only KShs. 70 per day - best market value affordable for every Kenyan family",
    },
    {
      title: "Familia Nzima",

      description:
        "Cover your whole family with one simple daily payment - Highest value for your money",
    },
  ];

  const requirements = [
    "Your National ID number & D.O.B",
    "Your Phone number (for M-Pesa)",
    "Your Residence Area",
    "Next of kin details - Name, Phone, ID Number, Date of birth",
    "Dependant information (spouse/children) - Name, D.O.B, Birth Certificate/ID Numbers",
  ];

  return (
    <Layout navbarVariant="full" footerVariant="full" background="bg-white">
      {/* Hero Section */}
      <section className="relative pb-0 lg:pb-10 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-white via-primary-50 to-white" />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-400 rounded-full opacity-30 blur-3xl" />

        <div className="relative max-w-screen-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-2xl lg:text-3xl mb-3 font-extrabold font-google text-tertiary-700 leading-tight">
                Okoa Familia Yako
                <span className="text-primary-700">
                  {" "}
                  kwa KShs. 70 tu kwa siku
                </span>
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed font-google font- mb-4 lg:mb-6">
                Simple, affordable health insurance for low income Kenyan
                families. Protect your loved ones with a comprehensive medical
                cover - hospitali na matibabu kwa familia yote.
              </p>

              <div className="mb-6 lg:mb-8 flex lg:flex-row flex-col items-center gap-2 font-google">
                <Link to="/register " className="w-full">
                  <div className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3 lg:py-3.5 text-sm lg:text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-full transition-colors shadow-lg shadow-primary-500/25">
                    Join Okoa Familia
                    <TbArrowRight className="w-5 h-5" />
                  </div>
                </Link>
                <Link to="/register " className="w-full">
                  <div className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3 lg:py-3.5 text-sm lg:text-base font-semibold  text-tertiary-700 hover:text-white bg-transparent border-2 border-tertiary-700 hover:bg-tertiary-700 rounded-full transition-colors shadow-lg shadow-tertiary-500/25">
                    Lipia Daily Okoa Familia
                    <TbArrowRight className="w-5 h-5" />
                  </div>
                </Link>
              </div>

              {/* Stats inline */}
              <div className="mt-8 lg:mt-10 pl-4 justify-center lg:justify-start flex items-center gap-4 md:gap-6 lg:gap-8">
                <div>
                  <div className="text-[1.1rem] md:text-xl lg:text-2xl font-extrabold text-primary-600 font-google">
                    KShs. 70
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">
                    Per Day
                  </div>
                </div>
                <div className="h-8 lg:h-12 w-px bg-gray-200" />
                <div>
                  <div className="text-[1.1rem] md:text-xl lg:text-2xl font-extrabold text-secondary-600 font-google">
                    Upto 7
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">
                    Family Members
                  </div>
                </div>
                <div className="h-8 lg:h-12 w-px bg-gray-200" />
                <div>
                  <div className="text-[1.1rem] md:text-xl lg:text-2xl font-extrabold text-tertiary-600 font-google">
                    24/7
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600">
                    Cover Active
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Visual/Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative -mx-2 lg:mx-2"
            >
              <div className="relative z-10">
                <div className="relative rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl overflow-hidden min-h-[200px] lg:max-h-[350px]">
                  <img
                    src="/bg.jpg"
                    alt="Okoa Familia - Family Protection"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-primary-900/80 z-10" />
                  <div className="absolute inset-0 bg-tertiary-800/20 z-10" />
                  {/* Benefits text overlay */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-center items-start p-4 md:p-6 lg:p-8 text-white font-google">
                    <div className="space-y-3 lg:space-y-4">
                      <div className="flex items-start gap-3">
                        <div>
                          <FiCheckCircle className="mt-0.5 w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>

                        <span className="text-[0.8rem] md:text-[0.9rem] lg:text-[1.2rem] font-semibold">
                          Inpatient Care & Hospital Stays Up to KShs. 200,000
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div>
                          {" "}
                          <FiCheckCircle className="mt-0.5 w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>

                        <span className="text-[0.8rem] md:text-[0.9rem] lg:text-[1.2rem] font-semibold">
                          Outpatient Services Up to KShs. 20,000
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div>
                          {" "}
                          <FiCheckCircle className="mt-0.5 w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>

                        <span className="text-[0.8rem] md:text-[0.9rem] lg:text-[1.2rem] font-semibold">
                          Maternity Cover & Delivery Care Up to KShs. 40,000
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div>
                          <FiCheckCircle className="mt-0.5 w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>

                        <span className="text-[0.8rem] md:text-[0.9rem] lg:text-[1.2rem] font-semibold">
                          Last Expense & Funeral Support Up to KShs. 50,000
                        </span>
                      </div>
                      <div className="shrink-0 inline-flex items-start gap-3">
                        <div>
                          <FiCheckCircle className="mt-0.5 w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <span className="text-[0.8rem] md:text-[0.9rem] lg:text-[1.2rem] font-semibold">
                          Daily Hospital Cash of KShs. 500 from Day 2 Up to 10
                          days per year
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-10 md:py-12 lg:py-14 bg-white">
        <div className="max-w-336 mx-auto px-4">
          <div className="text-center mb-6 md:mb-8 lg:mb-12">
            <h2 className="text-xl md:text-2xl lg:text-4xl font-extrabold font-google text-secondary-600 mb-4">
              What You Get with Okoa Familia
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-google text-[0.9rem] md:text-base lg:text-lg">
              Comprehensive health coverage designed for Kenyan families
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-linear-to-br from-white to-primary-50 rounded-2xl p-6 lg:p-8 border border-primary-100 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-lg font-bold text-primary-700 mb-2 font-google">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm lg:text-base">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-10 md:py-12 lg:py-14 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 lg:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold font-google text-gray-900 mb-2 lg:mb-4">
              How to Join Okoa Familia
            </h2>
            <p className="text-gray-800 leading-relaxed mx-auto font-google max-w-4xl text-base md:text-lg lg:text-xl">
              Jiandikishe Leo Chini ya dakika 5. Zero paper work, instant
              coverage for your whole family.
            </p>
          </div>

          {/* Registration Steps */}
          <div className="space-y-16 lg:space-y-20">
            {/* Step 1 - Text Left, Image Right on lg+ */}
            <article className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className="shrink-0 w-10 h-10 lg:w-16 lg:h-16 bg-primary-700 text-white rounded-full flex items-center justify-center text-lg md:text-xl lg:text-2xl font-bold shadow-lg"
                    aria-hidden="true"
                  >
                    1.
                  </div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 font-google">
                    Fill out our online registration form
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed tracking-wide text-base lg:text-lg ml-0 lg:ml-20 xl:ml-24">
                  From the Okoa Familia website, click on "Jiandikishe" or "Join
                  Okoa Familia" to start the registration process. Enter your
                  personal information including your name, ID number, phone
                  number, date of birth, and county. The process is quick and
                  straightforward.
                </p>
                <div className="mt-6 ml-0 lg:ml-20 xl:ml-24">
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm md:text-base font-semibold text-white bg-secondary-600 hover:bg-secondary-700 rounded-full transition-colors shadow-lg shadow-secondary-500/25"
                  >
                    Jiandikishe Leo
                    <TbArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <LaptopMockup
                  imageSrc="/registration-form-placeholder.png"
                  alt="Okoa Familia registration form - Sign up for affordable medical coverage in Kenya"
                  className="w-full"
                />
              </div>
            </article>

            {/* Step 2 - Text Right, Image Left on lg+ */}
            <article className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-1 lg:order-1">
                <LaptopMockup
                  imageSrc="/family-registration-placeholder.png"
                  alt="Okoa Familia family registration - Add dependants and next of kin for affordable medical coverage"
                  className="w-full"
                />
              </div>
              <div className="order-2 lg:order-2">
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className="shrink-0 w-10 h-10 lg:w-16 lg:h-16 bg-primary-700 text-white rounded-full flex items-center justify-center text-lg md:text-xl lg:text-2xl font-bold shadow-lg"
                    aria-hidden="true"
                  >
                    2.
                  </div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 font-google">
                    Add your family members
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed tracking-wide text-base lg:text-lg ml-0 lg:ml-20 xl:ml-24">
                  Add your next of kin details and include your dependants
                  (spouse and up to 6 children). Enter their names, dates of
                  birth, birth certificates/ID numbers and relationships. You
                  can protect your whole family with one simple registration.
                </p>
              </div>
            </article>

            {/* Step 3 - Text Left, Image Right on lg+ */}
            <article className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className="shrink-0 w-10 h-10 lg:w-16 lg:h-16 bg-primary-700 text-white rounded-full flex items-center justify-center text-lg md:text-xl lg:text-2xl font-bold shadow-lg"
                    aria-hidden="true"
                  >
                    3.
                  </div>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 font-google">
                    Complete payment and get protected
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed tracking-wide text-base lg:text-lg ml-0 lg:ml-20 xl:ml-24">
                  Create your password, review all your information, and submit
                  your registration. Pay KES 70 via M-Pesa to activate your
                  policy. Once completed, you'll receive instant confirmation
                  and your affordable health insurance policy will be active
                  immediately. Your whole family is now protected!
                </p>
                <div className="mt-6 ml-0 lg:ml-20 xl:ml-24">
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm md:text-base font-semibold text-white bg-tertiary-600 hover:bg-tertiary-700 rounded-full transition-colors shadow-lg shadow-tertiary-500/30"
                  >
                    Join Okoa Familia
                    <TbArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <LaptopMockup
                  imageSrc="/success-placeholder.png"
                  alt="Okoa Familia registration completion - Your affordable medical coverage in Kenya is now active"
                  className="w-full"
                />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="pt-8 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6 lg:mb-10">
              <h2 className="text-xl md:text-2xl lg:text-4xl font-extrabold font-google text-secondary-700 mb-4">
                What You Need to Register
              </h2>
              <p className="text-gray-600 font-google text-[0.95rem] md:text-base lg:text-lg">
                Have these details ready before you start
              </p>
            </div>

            <div className="-mx-4 lg:mx-0bg-linear-to-br from-secondary-50 to-white lg:rounded-2xl p-4 md:p-6 lg:p-8 border border-secondary-100">
              <ul className="space-y-4">
                {requirements.map((req, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-5 lg:w-8 h-5 lg:h-8 rounded-full bg-secondary-500 flex items-center justify-center shrink-0">
                      <TbCheck className="w-3 md:w-5 h-3 md:h-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{req}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-12 lg:py-14 bg-linear-to-r from-primary-900 via-primary-800 to-secondary-900">
      
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-4xl font-extrabold text-white font-google mb-4">
            Ready to Protect Your Family?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8 font-google text-[0.95rem] md:text-base lg:text-lg">
            Join thousands of Kenyan families who have secured their health with
            Okoa Familia. Start today for just KShs. 70.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-3 text-sm md:text-base lg:text-lg font-bold text-gray-900 bg-white hover:bg-gray-100 rounded-full transition-all shadow-xl"
            >
              Join Okoa Familia
              <TbArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pay"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-sm md:text-base lg:text-lg font-semibold text-tertiary-400 border-2 border-tertiary-500 hover:border-tertiary-600 rounded-full transition-all"
            >
              Pay Your Daily Premium
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
