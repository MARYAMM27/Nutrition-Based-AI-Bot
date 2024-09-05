app.post('/', (request, response) => {
    const agent = new WebhookClient({ request, response });

    async function mealPlan(agent) {
        const calories = agent.parameters.calories;
        console.log(calories);
        try {
            let responseText = "Here's your meal plan for the week:\n\n";

            // Generate meal plan for 7 days
            for (let day = 1; day <= 7; day++) {
                const mealPlan = await generateMealPlan(calories);
                responseText += `Day ${day}:\n`;

                // Breakfast
                responseText += `Breakfast: ${mealPlan["Breakfast"]["name"]}\n`;
                responseText += `Calories: ${mealPlan["Breakfast"]["calories"]}\n`;
                responseText += `Protein: ${mealPlan["Breakfast"]["protein"]}g\n`;
                responseText += `Carbs: ${mealPlan["Breakfast"]["carbs"]}g\n`;
                responseText += `Fats: ${mealPlan["Breakfast"]["fat"]}g\n`;
                responseText += `Ingredients: ${mealPlan["Breakfast"]["ingredients"]}\n`;
                responseText += `Recipe: ${mealPlan["Breakfast"]["recipe"]}\n\n`;

                // Lunch
                responseText += `Lunch: ${mealPlan["Lunch"]["name"]}\n`;
                responseText += `Calories: ${mealPlan["Lunch"]["calories"]}\n`;
                responseText += `Protein: ${mealPlan["Lunch"]["protein"]}g\n`;
                responseText += `Carbs: ${mealPlan["Lunch"]["carbs"]}g\n`;
                responseText += `Fats: ${mealPlan["Lunch"]["fat"]}g\n`;
                responseText += `Ingredients: ${mealPlan["Lunch"]["ingredients"]}\n`;
                responseText += `Recipe: ${mealPlan["Lunch"]["recipe"]}\n\n`;

                // Dinner
                responseText += `Dinner: ${mealPlan["Dinner"]["name"]}\n`;
                responseText += `Calories: ${mealPlan["Dinner"]["calories"]}\n`;
                responseText += `Protein: ${mealPlan["Dinner"]["protein"]}g\n`;
                responseText += `Carbs: ${mealPlan["Dinner"]["carbs"]}g\n`;
                responseText += `Fats: ${mealPlan["Dinner"]["fat"]}g\n`;
                responseText += `Ingredients: ${mealPlan["Dinner"]["ingredients"]}\n`;
                responseText += `Recipe: ${mealPlan["Dinner"]["recipe"]}\n\n`;

                responseText += "\n"; // Add a new line between each day
            }

            // Send response back to Dialogflow
            agent.add(responseText);
        } catch (error) {
            console.error('Error:', error);
            agent.add("Sorry, there was an error generating the meal plan. Please try again later.");
        }
    }

    let intentMap = new Map();
    intentMap.set('MealPlanIntent', mealPlan); // Map "MealPlanIntent" action to the mealPlan function
    agent.handleRequest(intentMap);
});
