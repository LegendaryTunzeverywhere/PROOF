# Web Development - Comprehensive Curriculum (Basic to Intermediate)

## 🎯 Learning Path Structure: 25 Lessons

**Total Duration**: ~12-15 hours of learning + 10-12 hours of practice
**Outcome**: Build production-ready websites from scratch

---

## 📚 LEVEL 1: ABSOLUTE BEGINNER (8 lessons)

### **Module 1: HTML Foundations**

#### Lesson 1.1: What is HTML? (20 min)
**Goal**: Understand what HTML is and see your first webpage
- What browsers do
- HTML as a language of meaning, not appearance
- Your first element: `<p>Hello World</p>`
- Opening files in a browser
**Challenge**: Write a 3-paragraph "About Me" page
**Proof**: Must use p, h1, title tags correctly

#### Lesson 1.2: Document Structure (20 min)
**Goal**: Build a complete valid HTML document
- DOCTYPE declaration (why it matters)
- html, head, body elements
- meta charset and viewport
- title element (shows in tab)
**Challenge**: Create a valid page structure for a recipe
**Proof**: Must pass HTML validator checks

#### Lesson 1.3: Headings & Paragraphs (20 min)
**Goal**: Structure text content meaningfully
- h1-h6 hierarchy (only one h1)
- When to use which heading level
- Paragraph vs line break
- Strong vs em (meaning over appearance)
**Challenge**: Structure a blog post with proper headings
**Proof**: Correct heading hierarchy, no skipped levels

#### Lesson 1.4: Links & Navigation (25 min)
**Goal**: Connect pages and external resources
- Anchor tag anatomy: href, text, title
- Relative vs absolute URLs
- Opening in new tab (target="_blank" + rel)
- Email and phone links
- Fragment identifiers (#section)
**Challenge**: Build a 3-page site with navigation menu
**Proof**: All links work, navigation on every page

#### Lesson 1.5: Images & Media (25 min)
**Goal**: Embed images accessibly
- img tag: src, alt, width, height
- Why alt text matters (accessibility)
- Image formats: jpg, png, svg, webp
- Responsive images basics (srcset intro)
- Figure and figcaption
**Challenge**: Create a photo gallery page with captions
**Proof**: Every image has meaningful alt text

#### Lesson 1.6: Lists (20 min)
**Goal**: Display ordered and unordered content
- ul vs ol (when to use each)
- li elements and nesting
- Description lists (dl, dt, dd)
- Navigation with lists
**Challenge**: Build a recipe with ingredient list and numbered steps
**Proof**: Proper list types, correct nesting

#### Lesson 1.7: Semantic HTML (30 min)
**Goal**: Use HTML for meaning, not styling
- header, nav, main, article, section, aside, footer
- When to use div vs semantic elements
- Why semantics matter (SEO, accessibility, maintenance)
- Landmarks for screen readers
**Challenge**: Convert a div-soup page to semantic HTML
**Proof**: Proper landmark structure, no unnecessary divs

#### Lesson 1.8: Forms Basics (30 min)
**Goal**: Collect user input
- form, input, label, button elements
- Input types: text, email, password, number
- Required fields
- Label-input association (for/id)
- Submit button vs regular button
**Challenge**: Build a contact form (name, email, message)
**Proof**: Proper labels, input types, required validation

---

### **Module 2: CSS Foundations**

#### Lesson 2.1: CSS Syntax & Selectors (25 min)
**Goal**: Style elements with CSS
- Rule anatomy: selector { property: value; }
- Element, class, ID selectors
- When to use classes vs IDs
- Linking CSS file vs style tag
- The cascade: specificity and source order
**Challenge**: Style your About Me page with colors and fonts
**Proof**: External CSS file, 5+ styled elements

#### Lesson 2.2: Colors & Typography (30 min)
**Goal**: Control text appearance
- Color formats: names, hex, rgb, hsl
- color vs background-color
- font-family (system fonts vs web fonts)
- font-size: px, rem, em
- font-weight, font-style, line-height
- text-align, text-decoration
**Challenge**: Create a styled article with good typography
**Proof**: Custom fonts, readable line-height, color contrast

#### Lesson 2.3: The Box Model (30 min)
**Goal**: Understand element spacing
- content, padding, border, margin
- box-sizing: border-box
- Collapsing margins
- Padding vs margin (when to use each)
- Debugging with browser DevTools
**Challenge**: Style cards with proper spacing
**Proof**: Consistent padding/margin, no layout breaks

#### Lesson 2.4: Display & Positioning (30 min)
**Goal**: Control element layout behavior
- display: block, inline, inline-block, none
- position: static, relative, absolute, fixed, sticky
- z-index and stacking contexts
- When to use positioning (rare!)
**Challenge**: Build a sticky navigation bar
**Proof**: Nav sticks to top on scroll, proper z-index

#### Lesson 2.5: Flexbox Basics (35 min)
**Goal**: Layout elements in one dimension
- display: flex
- flex-direction: row vs column
- justify-content (main axis alignment)
- align-items (cross axis alignment)
- gap for spacing
- Common patterns: navbar, card row, button group
**Challenge**: Build a responsive card layout with flexbox
**Proof**: Flexible cards, proper gaps, centered content

#### Lesson 2.6: CSS Grid Basics (35 min)
**Goal**: Create two-dimensional layouts
- display: grid
- grid-template-columns, grid-template-rows
- gap for spacing
- grid-column, grid-row for placement
- fr units and repeat()
**Challenge**: Build a photo grid gallery
**Proof**: Grid layout, responsive columns, proper gaps

#### Lesson 2.7: Responsive Design Intro (35 min)
**Goal**: Make layouts adapt to screen size
- Mobile-first thinking
- Media queries: @media (min-width: ...)
- Fluid units: %, rem, vw, vh
- clamp() for fluid sizing
- Testing at different widths
**Challenge**: Make your portfolio page responsive (320px to desktop)
**Proof**: Works 320px-1920px, 2+ media queries

#### Lesson 2.8: CSS Variables & Organization (30 min)
**Goal**: Write maintainable CSS
- Custom properties: --variable-name
- :root for global variables
- Color palettes with variables
- Spacing scales
- Organizing CSS files
- Comments and sections
**Challenge**: Refactor existing CSS to use variables
**Proof**: 5+ CSS variables, organized sections

---

## 📚 LEVEL 2: BEGINNER (8 lessons)

### **Module 3: Advanced HTML & Accessibility**

#### Lesson 3.1: Tables (25 min)
**Goal**: Display tabular data properly
- table, thead, tbody, tfoot
- tr, th, td elements
- colspan and rowspan
- Accessible table markup
- When NOT to use tables (layout!)
**Challenge**: Build a pricing comparison table
**Proof**: Proper table structure, headers, responsive

#### Lesson 3.2: HTML5 Form Elements (30 min)
**Goal**: Build rich input experiences
- Input types: date, time, color, range, file
- textarea for multiline text
- select and option for dropdowns
- datalist for autocomplete
- fieldset and legend for grouping
**Challenge**: Build a job application form
**Proof**: 8+ input types, proper grouping, validation

#### Lesson 3.3: Accessibility Essentials (35 min)
**Goal**: Make content usable by everyone
- ARIA labels and roles (when needed)
- Focus management
- Skip navigation links
- Color contrast requirements
- Screen reader testing basics
- Keyboard navigation
**Challenge**: Audit and fix an inaccessible page
**Proof**: Pass WAVE checker, keyboard navigable

#### Lesson 3.4: SVG Basics (30 min)
**Goal**: Use vector graphics
- SVG vs PNG/JPG (when to use)
- Inline SVG vs img src
- Basic shapes: circle, rect, path
- viewBox and preserveAspectRatio
- Styling SVG with CSS
**Challenge**: Create icon set with inline SVG
**Proof**: 5+ icons, scalable, CSS-styled

---

### **Module 4: JavaScript Foundations**

#### Lesson 4.1: JavaScript Basics (35 min)
**Goal**: Write your first interactive code
- Variables: const, let (never var)
- Data types: string, number, boolean, array, object
- Console.log for debugging
- Linking JS file to HTML
- Script tag placement (defer)
**Challenge**: Create variables for a user profile
**Proof**: Proper const/let usage, console output

#### Lesson 4.2: Functions (35 min)
**Goal**: Package reusable logic
- Function declaration vs expression vs arrow
- Parameters and arguments
- Return values
- Function scope
- When to use functions
**Challenge**: Write 5 utility functions (greet, calculate, format, etc)
**Proof**: Functions with params, returns, called correctly

#### Lesson 4.3: Conditionals & Logic (30 min)
**Goal**: Make decisions in code
- if/else statements
- Comparison operators: ===, !==, <, >, <=, >=
- Logical operators: &&, ||, !
- Ternary operator
- Switch statements
- Truthiness and falsiness
**Challenge**: Build a grade calculator
**Proof**: Multiple conditions, proper comparisons

#### Lesson 4.4: Arrays & Loops (35 min)
**Goal**: Work with collections
- Creating and accessing arrays
- Array methods: push, pop, shift, unshift
- for loop, for...of loop
- Array methods: map, filter, find, forEach
- When to use which method
**Challenge**: Process a list of products (filter, map, calculate)
**Proof**: Uses map/filter, correct iteration

---

### **Module 5: DOM Manipulation**

#### Lesson 5.1: Selecting Elements (30 min)
**Goal**: Find and reference HTML elements
- querySelector vs querySelectorAll
- getElementById, getElementsByClassName (legacy)
- Nodelist vs HTMLCollection
- Storing references in variables
**Challenge**: Build a DOM inspector tool
**Proof**: Selects and displays element info

#### Lesson 5.2: Changing Content (30 min)
**Goal**: Update page dynamically
- textContent vs innerHTML (security!)
- classList: add, remove, toggle
- setAttribute and getAttribute
- style property (inline styles)
- When to use classes vs inline styles
**Challenge**: Build a theme switcher
**Proof**: Changes colors, saves preference, no XSS

#### Lesson 5.3: Events & Listeners (35 min)
**Goal**: React to user actions
- addEventListener syntax
- Event types: click, input, submit, keydown
- Event object (event.target, event.preventDefault)
- Removing event listeners
- Event delegation pattern
**Challenge**: Build an interactive to-do list
**Proof**: Add/remove items, mark complete, persist

#### Lesson 5.4: Forms & Validation (35 min)
**Goal**: Handle form submissions
- Preventing default form submission
- Getting input values
- Client-side validation
- Displaying error messages
- Form reset
**Challenge**: Build a signup form with validation
**Proof**: Validates email, password, shows errors

---

## 📚 LEVEL 3: INTERMEDIATE (9 lessons)

### **Module 6: Advanced CSS**

#### Lesson 6.1: Advanced Selectors (30 min)
**Goal**: Target elements precisely
- Pseudo-classes: :hover, :focus, :nth-child
- Pseudo-elements: ::before, ::after
- Attribute selectors
- Combinators: >, +, ~
- :not() and :is()
**Challenge**: Style a data table with zebra stripes and hover
**Proof**: Uses 5+ advanced selectors

#### Lesson 6.2: CSS Transitions (30 min)
**Goal**: Add smooth animations
- transition property syntax
- Transition timing functions
- Transitioning multiple properties
- Performance considerations
- Use cases: hover, focus, state changes
**Challenge**: Build interactive button states
**Proof**: Smooth transitions, multiple states

#### Lesson 6.3: CSS Animations (35 min)
**Goal**: Create keyframe animations
- @keyframes syntax
- animation property
- Animation timing, delay, iteration
- Animation fill modes
- Performance best practices
**Challenge**: Create a loading spinner and fade-in effect
**Proof**: Keyframe animations, infinite loop, performant

#### Lesson 6.4: Advanced Layout Patterns (40 min)
**Goal**: Master complex layouts
- Holy grail layout with grid
- Sidebar patterns
- Card masonry with grid
- Sticky footer
- Full-height sections
**Challenge**: Build a dashboard layout
**Proof**: Multi-column, sticky sidebar, responsive

---

### **Module 7: Advanced JavaScript**

#### Lesson 7.1: Objects & Methods (35 min)
**Goal**: Work with structured data
- Object literal syntax
- Accessing properties: dot vs bracket
- Methods (functions in objects)
- this keyword
- Object destructuring
**Challenge**: Build a shopping cart object
**Proof**: Methods for add/remove/total, proper this usage

#### Lesson 7.2: ES6+ Features (35 min)
**Goal**: Use modern JavaScript
- Template literals
- Destructuring assignment
- Spread operator
- Rest parameters
- Default parameters
- Optional chaining
**Challenge**: Refactor old code to ES6+
**Proof**: Uses 5+ modern features

#### Lesson 7.3: Async JavaScript (40 min)
**Goal**: Handle time and delays
- setTimeout and setInterval
- Promises basics
- async/await syntax
- Error handling with try/catch
- Promise.all for parallel operations
**Challenge**: Build a delayed notification system
**Proof**: Async operations, proper error handling

#### Lesson 7.4: Fetch & APIs (40 min)
**Goal**: Get data from servers
- fetch() syntax
- HTTP methods: GET, POST
- Request headers
- Response handling
- Error states and loading states
- CORS basics
**Challenge**: Build a weather app using a public API
**Proof**: Fetches data, handles errors, updates UI

#### Lesson 7.5: Local Storage (30 min)
**Goal**: Persist data in browser
- localStorage vs sessionStorage
- setItem, getItem, removeItem
- Storing objects (JSON.stringify/parse)
- Storage events
- Privacy considerations
**Challenge**: Add persistence to todo app
**Proof**: Saves/loads data, survives refresh

---

### **Module 8: Real-World Projects**

#### Lesson 8.1: Project Planning (30 min)
**Goal**: Break down projects systematically
- Wireframing basics
- Component identification
- Data structure planning
- Feature prioritization
- Git workflow basics
**Challenge**: Plan a multi-page portfolio site
**Proof**: Wireframes, component list, data structure

#### Lesson 8.2: Component-Based Thinking (35 min)
**Goal**: Build reusable UI pieces
- What makes a component
- HTML templates
- Scoped styles
- Reusability patterns
- Documentation
**Challenge**: Build a card component library
**Proof**: 3+ card variants, reusable CSS

#### Lesson 8.3: Performance Basics (35 min)
**Goal**: Optimize loading speed
- Image optimization
- Lazy loading
- Minification and bundling
- Critical CSS
- Lighthouse audits
**Challenge**: Optimize a slow page
**Proof**: Lighthouse score >90

---

## 🎯 FINAL ASSESSMENT: Full-Stack Landing Page

**Duration**: 90 minutes
**Description**: Build a complete, production-ready landing page for a product/service of your choice

**Requirements**:
1. Semantic HTML5 structure
2. Responsive design (mobile-first)
3. Accessible (WCAG AA)
4. Interactive features (form, navigation, animations)
5. Fetch data from public API
6. Local storage for preferences
7. Smooth animations and transitions
8. Optimized performance (Lighthouse >85)
9. Clean, organized code with comments
10. Cross-browser compatible

**Pass Score**: 80/100
**Reward**: 10 NIM + 500 XP + "Web Developer" verified skill badge

---

## 📊 Curriculum Metrics

**Total Lessons**: 25
**Total Duration**: 
- Lessons: ~13 hours
- Challenges: ~12 hours
- Final: 1.5 hours
- **Total: ~26.5 hours**

**Progression Path**:
```
Level 1 (8 lessons) → Level 2 (8 lessons) → Level 3 (9 lessons) → Final Assessment
```

**Skills Unlocked**:
- ✅ Build websites from scratch
- ✅ Make them responsive and accessible
- ✅ Add interactivity with JavaScript
- ✅ Work with APIs and data
- ✅ Deploy to production
