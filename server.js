const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const fs = require('fs');
const csv = require('csv-parser');



const app = express();
const port = 4000;

app.use(bodyParser.json());

 // Function to calculate macronutrients
 function calculateMacronutrients(calories, proteinRatio, carbRatio, fatRatio) {
  // Ensure the ratios add up to 100%
  const totalRatio = proteinRatio + carbRatio + fatRatio;
  if (totalRatio !== 100) {
    throw new Error('Macronutrient ratios must add up to 100%.');
  }

  // Calculate grams for each macronutrient
  const protein = (proteinRatio / 100) * calories / 4; // 4 calories per gram of protein
  const carbs = (carbRatio / 100) * calories / 4; // 4 calories per gram of carbs
  const fat = (fatRatio / 100) * calories / 9; // 9 calories per gram of fat

  return {
    protein: protein.toFixed(2),
    carbs: carbs.toFixed(2),
    fat: fat.toFixed(2)
  };
}


app.post('/', (request, response) => {
  const agent = new WebhookClient({ request, response });

  function welcome(agent) {
    const context = agent.getContext('Welcome');
    if (context && context.parameters && context.parameters.welcome) {
      agent.add('');
    } else {
      agent.add("Please Select From The Menu \n " + 
      "A. Calculate My BMI and Generate Daily Calories and Nutrients \n" +
       " Note: You Can Also Generate A Recipe Based On Your Needs And Meal \n" + 
      "B.To Generate 7-Days Meal Plan Enter B or Type 'Generate Diet Plan' ");
      agent.setContext({
        name: 'Welcome',
        lifespan: 1,
        parameters: {
          welcome: true,
        },
      });
    }
  }
 
  function calculateBMI(weight, height) {
    const bmi = weight / ((height / 100) ** 2);
    return bmi.toFixed(2);
  }

  function provideWeightLossRecommendations(bmi) {
    let recommendations = '';

    if (bmi < 18.5) {
      recommendations = `You are underweight. It is recommended to consult a nutritionist to create a healthy meal plan and exercise routine to gain weight.`;
    } else if (bmi >= 18.5 && bmi < 24.9) {
      recommendations = `Your weight is within the healthy range. It is recommended to maintain a balanced diet and engage in regular physical activity.`;
    } else if (bmi >= 24.9 && bmi < 29.9) {
      recommendations = `You are overweight. It is recommended to focus on a balanced diet with reduced calorie intake and increase physical activity to achieve weight loss.`;
    } else {
      recommendations = `You are obese. It is highly recommended to consult a healthcare professional or nutritionist to create a personalized weight loss plan.`;
    }

    return recommendations;
  }

  function calculateCalories(age, height, weight, gender, activityLevel, weightLossGoal) {
    // Harris-Benedict Equation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 66.4730 + (13.7516 * weight) + (5.0033 * height) - (6.7500 * age);
    } else {
      bmr = 655.0955 + (9.5634 * weight) + (1.8496 * height) - (4.6756 * age);
    }

    
  

    let activityFactor = 1.2;
    if (activityLevel === 'lightly active') {
      activityFactor = 1.375;
    } else if (activityLevel === 'moderately active') {
      activityFactor = 1.55;
    } else if (activityLevel === 'very active') {
      activityFactor = 1.725;
    } else if (activityLevel === 'extra active') {
      activityFactor = 1.9;
    }

    let calories = Math.round(bmr * activityFactor);
    if (weightLossGoal === 'maintain weight') {
      calories = Math.round(calories);
    } else if (weightLossGoal === 'mild weight loss') {
      calories = Math.round(calories * 0.9);
    } else if (weightLossGoal === 'normal weight loss') {
      calories = Math.round(calories * 0.8);
    } else if (weightLossGoal === 'extreme weight loss') {
      calories = Math.round(calories * 0.6);
    }

    return calories;
  }

  
  // Function to handle the 'details' intent
  function lossdetails(agent) {
        
    const age = agent.parameters.age;
    const height = agent.parameters.height;
    const weight = agent.parameters.weight;
      

    const bmi = calculateBMI(weight, height);
    const recommendations = provideWeightLossRecommendations(bmi);

    agent.add(`BMI: ${bmi}`);
    agent.add(recommendations);
    agent.add('Would you like to generate calories?');

    agent.setContext({
      name: 'generate-calories',
      lifespan: 3,
      parameters: {
        age: age,
        height: height,
        weight: weight,
      },
    });
  }

  // Function to handle the 'detailsyes' intent
  function yesdetail(agent) {
    const context = agent.getContext('generate-calories');
    console.log('Context:', context);

    if (context && context.parameters) {
      const age = context.parameters.age;
      const height = context.parameters.height;
      const weight = context.parameters.weight;
      const gender = agent.parameters.gender;

      const activityLevel = agent.parameters.activityLevel;
      const weightLossGoal = agent.parameters.weightLossGoal;

      console.log('age:', age);
      console.log('height:', height);
      console.log('weight:', weight);
      console.log('gender:', gender);
      console.log('activityLevel:', activityLevel);
      console.log('weightLossGoal:', weightLossGoal);

      const calories = calculateCalories(age, height, weight, gender, activityLevel, weightLossGoal);

      // Assuming prtoeins, carbs, and fat are calculated using calculateMacronutrients function
      const { protein, carbs, fat } = calculateMacronutrients(calories, 30, 40, 30);

      agent.add(`Estimated daily calories needed: ${calories}g \n Estimated daily proteins needed: ${protein}g.\n Estimated daily carbs needed: ${carbs}g \n Estimated daily fats needed: ${fat}g.`);
      agent.add("B.To Generate 7-Days Meal Plan Enter B or Type 'Generate Diet Plan'")

    } else {
      agent.add("Sorry, I couldn't find the necessary details to generate calories. Can you please provide them again?");
    }
  }
  async function generateMealOptions() {
    const mealOptions = {
        'Breakfast': [],
        'Lunch': [],
        'Dinner': [],
        'Snack': [],
        'Midmeal': [], // Add Midmeal category
        'randommeal':[]
      };

    async function readCSV(csvFilePath, mealType) {
        return new Promise((resolve, reject) => {
            const meals = [];
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    meals.push(row);
                })
                .on('end', () => {
                    mealOptions[mealType] = meals;
                    resolve();
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    await Promise.all([
        readCSV('Breakfast.csv', 'Breakfast'),
        readCSV('Dinner_data.csv', 'Dinner'),
        readCSV('Lunch_data.csv', 'Snack'),
        readCSV('Snack.csv', 'Midmeal'), // Read Midmeal data
        readCSV('khana_random.csv', 'randommeal')
      ]);

    return mealOptions;
}

// Function to select a random meal
function selectRandomMeal(meals) {
    return meals[Math.floor(Math.random() * meals.length)];
}
async function generateMealPlan(calories) {
  const mealOptions = await generateMealOptions();

  // Select random meals for each meal category
  const breakfastMeal = selectRandomMeal(mealOptions['Breakfast']);
  const lunchMeal = selectRandomMeal(mealOptions['Lunch']);
  const dinnerMeal = selectRandomMeal(mealOptions['Dinner']);
  const snackMeal = selectRandomMeal(mealOptions['Snack']);
  const midmealMeal = selectRandomMeal(mealOptions['Midmeal']); // Select Midmeal
  const randommeal = selectRandomMeal(mealOptions['randommeal']);
  // Return meal plan with selected meals
  return {
      "Breakfast": breakfastMeal,
      "Dinner": dinnerMeal,
      "Snack": snackMeal,
      "Midmeal": midmealMeal, // Add Midmeal to the returned meal plan
      "randommeal":randommeal
    };
}

async function mealPlan(agent) {
  const calories = agent.parameters.calories;
  console.log(calories);
  try {
    let responseText = ''; 
      // Validate calorie input
      if (calories < 1200 || calories > 3500) {
          agent.add('Sorry, please enter accurate amount.');
          agent.add('To generate BMI and Calories enter "A"');
      } else {
          // Generate meal plan for 7 days
          for (let day = 1; day <= 7; day++) {

              let remainingCalories = calories; // Initialize remaining calories for the day
              // agent.add(`Day ${day}:\n`);
              responseText += `Day ${day}:\n`;

             // while (remainingCalories > 200) {
                  const mealPlan = await generateMealPlan(remainingCalories);
                  console.log(mealPlan);
                //   if (remainingCalories <= 200) {
                //     //agent.add('Only 200 calories or fewer remaining. \n You Can Adjust This By Checking Fruits Chart .\n Enter "Fruit Chart".');
                //     break;
                // }

                  // Breakfast
                  const breakfast = mealPlan["Breakfast"];
                  responseText += `\nBreakfast: ${breakfast["name"]}\n`;
                  responseText += (`Calories: ${breakfast["calories"]}kcal\n`);
                  responseText += (`Protein: ${breakfast["protein"]}g\n`);
                  responseText += (`Carbs: ${breakfast["carbs"]}g\n`);
                  responseText += (`Fats: ${breakfast["fat"]}g\n`);
                  responseText += (`Ingredients: ${breakfast["ingredients"]}\n`);
                  responseText += (`Recipe: ${breakfast["recipe"]}\n`);

                  remainingCalories -= breakfast["calories"];

                  //agent.add(` ${remainingCalories}kcal\n\n`);

                //   if (remainingCalories <= 200) {
                //    // agent.add('Only 200 calories or fewer remaining.\n You Can Adjust This By Checking Fruits Chart .\n Enter "Fruit Chart" .');
                //     break;
                // }

                  // Lunch
                  const snack = mealPlan["Snack"];
                  responseText += (`\nLunch: ${snack["name"]}\n`);
                  responseText += (`Calories: ${snack["calories"]}kcal\n`);
                  responseText += (`Proteins: ${snack["protein"]}g\n`);
                  responseText += (`Carbs : ${snack["carbs"]}g\n`);
                  responseText += (`Fats : ${snack["fat"]}g\n`);
                  responseText += (`Ingredient: ${snack["ingredients"]}\n`);
                  responseText += (`Recipe : ${snack["recipe"]}\n`);

                  remainingCalories -= snack["calories"];
                  // agent.add(` ${remainingCalories}kcal\n\n`);

                //   if (remainingCalories <= 200) {
                //     //agent.add('Only 200 calories or fewer remaining. \n You Can Adjust This By Checking Fruits Chart .\n Enter "Fruit Chart".');
                //     break;
                // }

                  // Dinner
                  const dinner = mealPlan["Dinner"];
                  responseText += (`\nDinner: ${dinner["name"]}\n`);
                  responseText += (`Calories: ${dinner["calories"]}kcal\n`);
                  responseText += (`Proteins: ${dinner["protein"]}g\n`);
                  responseText += (`Carbs : ${dinner["carbs"]}g\n`);
                  responseText += (`Fats : ${dinner["fat"]}g\n`);
                  responseText += (`Ingredient: ${dinner["ingredients"]}\n`);
                  responseText += (`Recipe : ${dinner["recipe"]}\n`);
                  

                  remainingCalories -= dinner["calories"];
                  // agent.add(` ${remainingCalories}kcal\n\n`);

                //   if (remainingCalories <= 200) {
                //     //agent.add('Only 200 calories or fewer remaining. \n You Can Adjust This By Checking Fruits Chart .\n Enter "Fruit Chart".');
                //     break;
                // }

                  // Midmeal
                  const midmeal = mealPlan["Midmeal"];
                  responseText += (`\nMidmeal: ${midmeal["name"]}\n`);
                  responseText += (`Calories: ${midmeal["calories"]}kcal\n`);
                  responseText += (`Proteins: ${midmeal["protein"]}g\n`);
                  responseText += (`Carbs : ${midmeal["carbs"]}g\n`);
                  responseText += (`Fats : ${midmeal["fat"]}g\n`);
                  responseText += (`Ingredient: ${midmeal["ingredients"]}\n`);
                  responseText += (`Recipe : ${midmeal["recipe"]}\n`);


                  remainingCalories -= midmeal["calories"];
                  // agent.add(` ${remainingCalories}kcal\n\n`);

                  while (remainingCalories > 200) {
                    const mealPlan = await generateMealPlan(remainingCalories);
                    const randommeal = mealPlan["randommeal"];
                    responseText += (`\nAdditional Meal : ${randommeal["name"]}\n`);
                    responseText += (`Calories: ${randommeal["calories"]}kcal\n`);
                    responseText += (`Proteins: ${randommeal["protein"]}g\n`);
                    responseText += (`Carbs : ${randommeal["carbs"]}g\n`);
                    responseText += (`Fats : ${randommeal["fat"]}g\n`);
                    responseText += (`Ingredient: ${randommeal["ingredients"]}\n`);
                    responseText += (`Recipe : ${randommeal["recipe"]}\n`);

                    remainingCalories -= randommeal["calories"];

                    if (remainingCalories <= 200 ) {
                      responseText +=(` \nRemaining Calories: ${remainingCalories}kcal\n\n`);
                      responseText +=('\nOnly few calories remaining. \n You Can Adjust This By Checking Fruits Chart .\n Enter "Fruit Chart".\n\n');

                          break;
                      }
                  }
                 //}              
          }agent.add(responseText);
          
          
                          
      }
  } catch (error) {
      console.error('Error:', error);
      agent.add("Sorry, there was an error generating the meal plan. Please try again later.");
  }
}

              

let intentMap = new Map();
intentMap.set('Default Welcome Intent', welcome);
intentMap.set('details', lossdetails);
intentMap.set('detailsyes', yesdetail);
intentMap.set('generateplan', mealPlan);


  agent.handleRequest(intentMap);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});