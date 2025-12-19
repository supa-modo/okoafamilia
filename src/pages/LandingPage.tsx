import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TbShieldCheck,
  TbHeartHandshake,
  TbCoin,
  TbUsers,
  TbClipboardCheck,
  TbArrowRight,
  TbCheck,
  TbUserPlus,
  TbCash,
  TbShieldCheckFilled,
  TbCircleCheck,
} from "react-icons/tb";
import Layout from "../components/Layout";
import { FiCheckCircle } from "react-icons/fi";

const LandingPage = () => {
  const benefits = [
    {
      icon: TbHeartHandshake,
      title: "Huduma ya Hospitali",
      description: "Matibabu ya hospitali - Inpatient & Outpatient cover",
    },
    {
      icon: TbShieldCheck,
      title: "Ulinzi wa Familia",
      description: "Protect spouse and up to 6 children under one plan",
    },
    {
      icon: TbCoin,
      title: "Bei Nafuu",
      description: "Only KES 70 per day - affordable for every Kenyan family",
    },
    {
      icon: TbUsers,
      title: "Familia Nzima",
      description: "Cover your whole family with one simple payment",
    },
  ];

  const howItWorks = [
    {
      step: 1,
      icon: TbUserPlus,
      title: "Jiandikishe",
      description: "Fill in your details and add your family members",
    },
    {
      step: 2,
      icon: TbCash,
      title: "Lipa KES 70",
      description: "Pay daily via M-Pesa - as simple as buying airtime",
    },
    {
      step: 3,
      icon: TbShieldCheckFilled,
      title: "Pata Ulinzi",
      description: "Your family is protected immediately after payment",
    },
  ];

  const requirements = [
    "National ID number",
    "Phone number (for M-Pesa)",
    "Date of birth",
    "Next of kin details",
    "Dependant information (spouse/children)",
  ];

  return (
    <Layout navbarVariant="full" footerVariant="full" background="bg-white">
      {/* Hero Section */}
      <section className="relative pb-0 lg:pb-10 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-white via-primary-50 to-white" />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-100 rounded-full opacity-30 blur-3xl" />

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
                cover - hospitali na matibabu for the whole family.
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
                {/* Placeholder for hero image - can be replaced with actual image */}
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
                  <div className="absolute inset-0 bg-black/70 z-10" />
                  <div className="absolute inset-0 bg-primary-600/30 z-10" />
                  {/* Benefits text overlay */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-center items-start p-4 md:p-6 lg:p-8 text-white">
                    <div className="space-y-3 lg:space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <FiCheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <span className="text-[0.9rem] lg:text-xl font-medium">
                          Inpatient Care & Hospital Stays Up to KShs. 200,000
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <FiCheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <span className="text-[0.9rem] lg:text-xl font-medium">
                          Outpatient Services Up to KShs. 20,000
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <FiCheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <span className="text-[0.9rem] lg:text-xl font-medium">
                          Maternity Cover & Delivery Care Up to KShs. 40,000
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <FiCheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <span className="text-[0.9rem] lg:text-xl font-medium">
                          Last Expense & Funeral Support Up to KShs. 50,000
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
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold font-google text-gray-900 mb-4">
              What You Get with Okoa Familia
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive health coverage designed for Kenyan families
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-white to-primary-50 rounded-2xl p-6 lg:p-8 border border-primary-100 hover:shadow-xl transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 font-lexend">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl lg:text-4xl font-bold text-white font-lexend mb-4">
              How to Join Okoa Familia
            </h2>
            <p className="text-primary-100 max-w-2xl mx-auto">
              Three simple steps to protect your family today
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white/10 flex items-center justify-center">
                    <item.icon className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center text-white font-bold font-lexend">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-lexend">
                  {item.title}
                </h3>
                <p className="text-primary-100">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-primary-700 bg-white hover:bg-primary-50 rounded-xl transition-all shadow-xl"
            >
              Start Registration
              <TbArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-100 mb-4">
                <TbClipboardCheck className="w-8 h-8 text-secondary-600" />
              </div>
              <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 font-lexend mb-4">
                What You Need to Register
              </h2>
              <p className="text-gray-600">
                Have these details ready before you start
              </p>
            </div>

            <div className="bg-gradient-to-br from-secondary-50 to-white rounded-2xl p-6 lg:p-8 border border-secondary-100">
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
                    <div className="w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center shrink-0">
                      <TbCheck className="w-5 h-5 text-white" />
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
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-4xl font-bold text-white font-lexend mb-4">
            Ready to Protect Your Family?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Join thousands of Kenyan families who have secured their health with
            Okoa Familia. Start today for just KES 70.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-gray-900 bg-white hover:bg-gray-100 rounded-xl transition-all shadow-xl"
            >
              Join Okoa Familia
              <TbArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pay"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 hover:border-white/50 rounded-xl transition-all"
            >
              Pay Daily Premium
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
