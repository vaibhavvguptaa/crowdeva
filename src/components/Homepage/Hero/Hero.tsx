import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-[91vh] flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-neutral-800 to-neutral-900 text-white overflow-hidden isolate">
      {/* Hero Decorations */}
      <div className="absolute inset-0 opacity-10 -z-10">
        <div
          className="absolute top-20 left-10 w-40 h-40 rounded-full bg-blue-500 mix-blend-screen filter blur-3xl animate-float-slow"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-purple-500 mix-blend-screen filter blur-3xl animate-float"
          aria-hidden="true"
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Streamline Your AI Workforce
          </span>
        </h1>
        <p className="max-w-3xl mx-auto text-gray-300 mb-10 text-lg md:text-xl leading-relaxed">
          The premier platform connecting businesses with expert AI annotators
          and providing cutting-edge tools for LLM evaluation. Optimize your AI
          pipeline with our end-to-end solution.
        </p>
        
        {/* Hero Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/hire"
            className="relative inline-flex items-center justify-center bg-white text-neutral-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            <span className="relative z-10">Hire Top Talent</span>
            <span
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 hover:opacity-100 transition-opacity duration-300"
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/jobs"
            className="relative inline-flex items-center justify-center bg-transparent border-2 border-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800/50 transition-all duration-300 transform hover:scale-105 hover:border-white group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            <span className="relative z-10 group-hover:text-white">
              Find Annotation Jobs
            </span>
            <span
              className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}