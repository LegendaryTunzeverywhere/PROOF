/**
 * Additional Structured Data (JSON-LD) for specific pages
 * Insert these dynamically based on the current view/page
 */

export const structuredData = {
  // Organization schema for brand recognition
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PROOF",
    "alternateName": "PROOF Learning Platform",
    "url": "https://proof.nimagent.online",
    "logo": "https://proof.nimagent.online/assets/proof-logo.svg",
    "description": "Turn learning into demonstrated ability and earn NIM cryptocurrency rewards",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "support@proof.nimiq.com"
    },
    "sameAs": [
      "https://twitter.com/nimiq",
      "https://github.com/nimiq",
      "https://discord.gg/nimiq",
      "https://t.me/nimiq"
    ]
  },

  // Course schema for learning paths
  course: (skillName, description, level, duration) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    "name": skillName,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": "PROOF",
      "url": "https://proof.nimagent.online"
    },
    "educationalLevel": level || "Beginner",
    "timeRequired": duration || "PT30M",
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "category": "Free with NIM rewards"
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": duration || "PT30M"
    }
  }),

  // FAQ schema for common questions
  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is PROOF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PROOF is a learn-to-earn platform where you can learn new skills through AI-powered paths, prove your abilities with real-world challenges, and earn NIM cryptocurrency rewards."
        }
      },
      {
        "@type": "Question",
        "name": "How do I earn NIM rewards?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Complete skill challenges successfully to earn NIM rewards. Each challenge validates your understanding through practical coding or problem-solving tasks. Passing a challenge generates a verified proof and rewards you with NIM."
        }
      },
      {
        "@type": "Question",
        "name": "What skills can I learn?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PROOF offers learning paths in web development, Python, JavaScript, React, data science, blockchain, AI, design, marketing, and many more skills. You can learn anything from coding to creative skills."
        }
      },
      {
        "@type": "Question",
        "name": "Is PROOF free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! PROOF is completely free to use. You can learn, practice, and earn NIM rewards without any subscription or payment. You only need a Nimiq wallet to collect your rewards."
        }
      },
      {
        "@type": "Question",
        "name": "What is a verified proof?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A verified proof is a cryptographically signed certificate that demonstrates you've successfully completed a challenge. It serves as verifiable evidence of your skills that you can share publicly or use to unlock paid work opportunities."
        }
      }
    ]
  },

  // HowTo schema for onboarding
  howTo: {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Get Started with PROOF",
    "description": "Learn how to start earning NIM by learning and proving new skills on PROOF",
    "image": "https://proof.nimagent.online/assets/og-image.png",
    "totalTime": "PT5M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "tool": {
      "@type": "HowToTool",
      "name": "Nimiq Wallet"
    },
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Connect Your Wallet",
        "text": "Connect your Nimiq wallet (Hub, Pay, or Demo) to get started",
        "url": "https://proof.nimagent.online/?view=onboarding"
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Choose a Skill",
        "text": "Select a skill you want to learn from web development, Python, design, and more",
        "url": "https://proof.nimagent.online/?view=learn"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Complete Challenges",
        "text": "Work through AI-generated lessons and complete practical challenges to prove your understanding",
        "url": "https://proof.nimagent.online/?view=prove"
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": "Earn NIM Rewards",
        "text": "Receive NIM cryptocurrency rewards for each successfully completed challenge",
        "url": "https://proof.nimagent.online/?view=profile"
      }
    ]
  },

  // BreadcrumbList for navigation
  breadcrumb: (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }),

  // Review schema for testimonials
  review: (author, rating, text, date) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "WebApplication",
      "name": "PROOF"
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": rating,
      "bestRating": "5",
      "worstRating": "1"
    },
    "author": {
      "@type": "Person",
      "name": author
    },
    "reviewBody": text,
    "datePublished": date
  }),

  // JobPosting schema for marketplace gigs
  jobPosting: (title, description, reward) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": title,
    "description": description,
    "hiringOrganization": {
      "@type": "Organization",
      "name": "PROOF Marketplace"
    },
    "jobLocationType": "TELECOMMUTE",
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Worldwide"
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "NIM",
      "value": {
        "@type": "QuantitativeValue",
        "value": reward,
        "unitText": "NIM"
      }
    },
    "validThrough": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": "CONTRACTOR",
    "directApply": true
  })
};

/**
 * Helper function to inject structured data into page
 * @param {string|object} schemaKey - Key from structuredData or custom schema object
 * @param  {...any} args - Arguments for schema function if schemaKey is a function
 */
export function injectStructuredData(schemaKey, ...args) {
  const schema = typeof schemaKey === 'string' 
    ? (typeof structuredData[schemaKey] === 'function' 
      ? structuredData[schemaKey](...args) 
      : structuredData[schemaKey])
    : schemaKey;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}
