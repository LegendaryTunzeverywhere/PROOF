import test from 'node:test';
import assert from 'node:assert/strict';

import {
  localDocumentCurriculum,
  buildDocumentLessonFallback,
} from '../server/services/document-curriculum.js';

test('fallback document curriculum creates a rich 7-day path from uploaded text', () => {
  const text = [
    'Machine learning is the process of teaching a system to find patterns in data by training on examples.',
    'Supervised learning uses labeled examples to predict outcomes such as spam or not spam.',
    'Evaluation measures how well the model performs on unseen data using loss and accuracy metrics.',
    'Feature engineering turns raw information into useful signals for better model decisions.',
    'A model is trained on data, then validated to catch overfitting before final testing.',
    'Bias is the systematic error that results from assumptions in the model or training data.',
    'Deployment is the process of making the model available to users in a real system.'
  ].join(' ');

  const curriculum = localDocumentCurriculum(text, 'ML fundamentals');

  assert.equal(curriculum.days.length, 7);
  assert.ok(curriculum.days[0].items.length >= 3);
  assert.ok(curriculum.days[0].items.every((item) => typeof item.title === 'string' && item.title.length > 8));
  assert.ok(curriculum.keyConcepts.length >= 3);
});

test('fallback lesson content includes sections, key points, practice and quiz questions', () => {
  const lesson = buildDocumentLessonFallback(
    'Batch normalization improves training stability by reducing internal covariate shift.',
    'batch-normalization',
    'Batch Normalization'
  );

  assert.ok(Array.isArray(lesson.sections) && lesson.sections.length >= 2);
  assert.ok(Array.isArray(lesson.keyPoints) && lesson.keyPoints.length >= 3);
  assert.ok(Array.isArray(lesson.practice) && lesson.practice.length >= 2);
  assert.ok(Array.isArray(lesson.quiz) && lesson.quiz.length >= 2);
  assert.ok(typeof lesson.summary === 'string' && lesson.summary.length > 20);
});
