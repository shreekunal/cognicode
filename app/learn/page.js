'use client';
import { useState, useEffect } from 'react';
import CourseCard from '@/app/learn/CourseCard';

const COURSE_META = {
  cpp:        { title: 'Introduction to C++',        desc: 'C++ is a high-level, general-purpose programming language created by Bjarne Stroustrup.', image: '/cpp.png' },
  python:     { title: 'Introduction to Python',     desc: 'Python is an interpreted, high-level and general-purpose programming language.',            image: '/python.png' },
  javascript: { title: 'Introduction to JavaScript', desc: 'JavaScript is a high-level, interpreted programming language conforming to ECMAScript.',    image: '/javascript.png' },
  java:       { title: 'Introduction to Java',       desc: 'Java is a high-level, class-based, object-oriented programming language.',                 image: '/java.png' },
  c:          { title: 'Introduction to C',           desc: 'C is a general-purpose, procedural programming language supporting structured programming.', image: '/c.png' },
};

const FALLBACK_COURSES = Object.entries(COURSE_META).map(([name, meta]) => ({
  name,
  title: meta.title,
  desc: meta.desc,
  image: meta.image,
  moduleCount: 0,
}));

export default function LearnPage() {
  const [courses, setCourses] = useState(FALLBACK_COURSES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();

        if (data && data.length > 0) {
          const mapped = data.map((c) => {
            const key = c.title?.toLowerCase().replace(/\s+/g, '');
            const meta = COURSE_META[c.title] || COURSE_META[key] || {};
            return {
              name: c.title,
              title: meta.title || c.title,
              desc: meta.desc || `Learn ${c.title}`,
              image: meta.image || '/default-course.png',
              moduleCount: c.modules?.length || 0,
            };
          });
          setCourses(mapped);
        }
      } catch {
        // keep fallback courses
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return (
    <div className="w-full min-h-[92vh] max-w-6xl mx-auto flex justify-center flex-wrap my-12 gap-6">
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent" />
        </div>
      ) : (
        courses.map((course, index) => (
          <CourseCard
            key={index}
            name={course.name}
            title={course.title}
            desc={course.desc}
            image={course.image}
            moduleCount={course.moduleCount}
          />
        ))
      )}
    </div>
  );
}