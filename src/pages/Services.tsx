import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Palette, Rocket, Smartphone, Search, Shield, Server, ArrowRight, Check } from 'lucide-react';

const Services: React.FC = () => {
  const services = [
    {
      icon: Code2,
      title: 'Web Development',
      description: 'Custom, responsive websites and web applications built with cutting-edge technologies.',
      features: ['React/Next.js', 'TypeScript', 'API Integration', 'Performance Optimization'],
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Palette,
      title: 'UI/UX Design',
      description: 'User-centered design that combines aesthetics with functionality.',
      features: ['Wireframing', 'Prototyping', 'User Research', 'Design Systems'],
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: Rocket,
      title: 'AI Solutions',
      description: 'Intelligent automation and AI-powered tools for your business.',
      features: ['Machine Learning', 'Natural Language Processing', 'Computer Vision', 'Automation'],
      color: 'from-orange-500 to-red-600',
    },
    {
      icon: Smartphone,
      title: 'Mobile Development',
      description: 'Native and cross-platform mobile applications.',
      features: ['React Native', 'iOS/Android', 'App Store Deployment', 'Push Notifications'],
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Server,
      title: 'IT Support & Infrastructure',
      description: 'Comprehensive IT solutions to keep your business running efficiently.',
      features: ['Hardware & Software Support', 'Network Setup', 'CCTV Installation', 'Access Control'],
      color: 'from-slate-600 to-gray-800',
    },
    {
      icon: Shield,
      title: 'Maintenance & Support',
      description: 'Ongoing support to keep your digital products running smoothly.',
      features: ['Bug Fixes', 'Security Updates', 'Performance Monitoring', 'Content Updates'],
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen pt-16">
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Digital solutions built around your{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                goals
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Every business has unique challenges. I deliver practical web, software, and AI solutions tailored to your needs.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="text-indigo-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Get Quote <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Have a project in mind?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Let's discuss your requirements and find the perfect solution.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            Start a Project
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
