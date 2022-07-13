const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const promise = require('./promiseHelpers.js');
const db = require('./database.js');

async function getQuestionsWithAnswers(productId) {
  let questions = await promise.getQuestions(productId)
  .then((questions) => {
    let notReported = [];

    for (var i = 0; i < questions.length; i++) {
      if (questions[i].reported !== 1) {
        notReported.push(questions[i]);
      }
    }

    return notReported;
  });

  questions = addAnswers(questions);

  return questions;
}

async function getAnswersWithPhotos(questionId) {
  let answers = await promise.iWantAnswers(questionId)
  .then((answers) => {
    let notReported = {};

    for (var j = 0; j < answers.length; j++) {
      if (answers[j].reported !== 1) {

        notReported[answers[j].id] = answers[j];
      }
    }

    return notReported;
  })

  for (var key in answers) {
    let id = answers[key].id;
    answers[key].photos = await promise.picsOrDidntHappen(id);
  }

  return answers;
}

async function addAnswers(questions) {
  for (var i = 0; i < questions.length; i++) {
    questions[i].answers = await promise.iWantAnswers(questions[i].question_id)
    .then((answers) => {
      let notReported = {};

      for (var j = 0; j < answers.length; j++) {
        if (answers[j].reported !== 1) {

          notReported[answers[j].id] = answers[j];
        }
      }

      return notReported;

    });


    for (var key in questions[i].answers) {
      if (questions[i].answers) {
        let id = questions[i].answers[key].id;
        questions[i].answers[key].photos = await promise.picsOrDidntHappen(id);
      }
    }

  }

  return questions;
}

async function addQuestion(params) {
  params.id = await promise.findNextQuestionId();

  return promise.postNewQuestion(params);
}

async function addAnswer(params) {
  params.id = await promise.findNextAnswerId();

  return promise.postNewAnswer(params);
}

async function helpful(collection, id) {
  let helpfulness;

  collection === 'questions' ? helpfulness = await promise.getQuestionHelpfulness(id) : helpfulness = await promise.getAnswerHelpfulness(id);

  return promise.markHelpful(collection, id, helpfulness);
}

async function report(collection, id) {
  let query;

  collection === 'questions' ? query = { question_id: id } : query = { id: id };

  await db.collection(collection).updateOne(query, { $set: { reported: 1 } });
};

module.exports = {
  getQuestionsWithAnswers,
  addAnswers,
  getAnswersWithPhotos,
  addQuestion,
  addAnswer,
  helpful,
  report
};