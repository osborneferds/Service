import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Palette, Rocket, Star, Users, Award, Clock } from 'lucide-react';

const Home: React.FC = () => {
  const stats = [
    { icon: Award, value: '150+', label: 'Projects Delivered' },
    { icon: Users, value: '80+', label: 'Happy Clients' },
    { icon: Clock, value: '25+', label: 'Years Experience' },
    { icon: Star, value: '4.9', label: 'Average Rating' },
  ];

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                Available for new projects
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                I build digital products
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  that solve real problems
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Web, software, and AI developer helping businesses turn ideas into reliable, modern digital solutions.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-xl transition-all flex items-center gap-2"
                >
                  Start a Project
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/portfolio"
                  className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-all"
                >
                  View My Work
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="font-mono text-sm space-y-2 text-gray-300">
                  <p><span className="text-purple-400">const</span> <span className="text-blue-400">developer</span> = {'{'}</p>
                  <p className="pl-4"><span className="text-green-400">name</span>: <span className="text-amber-400">"Osborne Fernandes"</span>,</p>
                  <p className="pl-4"><span className="text-green-400">role</span>: <span className="text-amber-400">"Web, Software & AI Developer"</span>,</p>
                  <p className="pl-4"><span className="text-green-400">passion</span>: <span className="text-amber-400">"Building technology that solves real problems"</span>,</p>
                  <p className="pl-4"><span className="text-green-400">available</span>: <span className="text-purple-400">true</span></p>
                  <p>{'}'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Digital solutions built for{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                real business needs
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From strategy and development to launch, I create practical web, software, and AI solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Code2, title: 'Web Development', desc: 'Custom websites and web applications', color: 'from-blue-500 to-indigo-600' },
              { icon: Palette, title: 'UI/UX Design', desc: 'Beautiful, intuitive interfaces', color: 'from-purple-500 to-pink-600' },
              { icon: Rocket, title: 'AI Solutions', desc: 'Intelligent automation and tools', color: 'from-orange-500 to-red-600' },
            ].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.desc}</p>
                <Link to="/services" className="text-indigo-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to bring your vision to life?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Let's collaborate and create something extraordinary.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            Let's Talk
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
