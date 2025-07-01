import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing notification webhook...');

    // Test data for behaviour questionnaire
    const testQuestionnaireData = {
      ownerFirstName: 'John',
      ownerLastName: 'Smith',
      email: 'john.smith@example.com',
      contactNumber: '555-123-4567',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'London',
      stateProvince: 'England',
      zipPostalCode: 'SW1A 1AA',
      country: 'United Kingdom',
      howDidYouHear: 'Google search',
      dogName: 'Buddy',
      age: '3 years',
      sex: 'Male',
      breed: 'Golden Retriever',
      neuteredSpayed: 'Yes, neutered',
      mainHelp: 'Excessive barking when left alone and pulling on the leash during walks',
      firstNoticed: 'About 6 months ago when we moved to a new house',
      whenWhereHow: 'Mainly happens when we leave for work in the morning, and during evening walks in the neighborhood',
      recentChange: 'Started a new job so leaving earlier in the morning',
      canAnticipate: 'Yes, usually starts barking within 5 minutes of us leaving',
      whyThinking: 'Separation anxiety combined with lack of proper leash training',
      whatDoneSoFar: 'Tried leaving toys, playing calming music, and using a different collar',
      idealGoal: 'Quiet departures and calm, controlled walks',
      anythingElse: 'He is generally very friendly and good with children',
      medicalHistory: 'No major health issues, up to date on vaccinations',
      vetAdvice: 'Vet suggested behavioral training for the separation anxiety',
      whereGotDog: 'Local animal shelter',
      rescueBackground: 'Was surrendered by previous owner due to moving',
      ageWhenGot: '1 year old',
      whatFeed: 'Royal Canin dry food, twice daily',
      foodMotivated: 'Very food motivated, loves treats',
      mealtime: 'Regular schedule at 7am and 6pm',
      treatRoutine: 'Training treats during walks and obedience practice',
      happyWithTreats: 'Yes, responds well to high-value treats',
      typesOfPlay: 'Fetch, tug-of-war, and puzzle toys',
      affectionate: 'Very affectionate, loves cuddles',
      exercise: 'Two 30-minute walks daily plus backyard play',
      useMuzzle: 'No muzzle needed',
      familiarPeople: 'Excellent with family and regular visitors',
      unfamiliarPeople: 'Initially cautious but warms up quickly',
      housetrained: 'Fully housetrained',
      likesToDo: 'Playing fetch, swimming, and meeting other dogs',
      likeAboutDog: 'His gentle nature and intelligence',
      mostChallenging: 'The separation anxiety and leash pulling',
      howGood: 'Excellent at basic commands like sit, stay, come',
      favouriteRewards: 'Chicken treats and praise',
      howBad: 'Moderate - manageable but needs improvement',
      effectOfBad: 'Neighbors have complained about barking, and walks are stressful',
      professionalTraining: 'Basic puppy classes when younger',
      sociabilityDogs: 'Excellent',
      sociabilityPeople: 'Good',
      anythingElseToKnow: 'He seems to do better when tired from exercise',
      timePerWeek: '1-2 hours for training exercises'
    };

    // Test data for behavioural brief
    const testBriefData = {
      ownerFirstName: 'Sarah',
      ownerLastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      contactNumber: '555-987-6543',
      postcode: 'M1 1AA',
      dogName: 'Luna',
      sex: 'Female',
      breed: 'Border Collie Mix',
      lifeWithDog: 'Luna is a wonderful companion but has some challenges with resource guarding around food and toys. She also gets overly excited when visitors come to the house and jumps on them. We would like help with these behaviors as well as general obedience training.',
      bestOutcome: 'A calm, well-behaved dog who can enjoy meals peacefully and greet visitors politely. We want to strengthen our bond and communication with Luna.',
      sessionType: 'In-Person'
    };

    console.log('Sending test behaviour questionnaire notification...');

    // Test behaviour questionnaire notification
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const questionnaireResponse = await fetch(`${baseUrl}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'behaviour_questionnaire',
        data: testQuestionnaireData
      })
    });

    const questionnaireResult = await questionnaireResponse.json();
    console.log('Questionnaire notification result:', questionnaireResult);

    // Wait a moment before sending the second test
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Sending test behavioural brief notification...');

    // Test behavioural brief notification
    const briefResponse = await fetch(`${baseUrl}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'behavioural_brief',
        data: testBriefData
      })
    });

    const briefResult = await briefResponse.json();
    console.log('Brief notification result:', briefResult);

    return NextResponse.json({
      message: 'Test notifications sent successfully',
      results: {
        questionnaire: {
          status: questionnaireResponse.status,
          result: questionnaireResult
        },
        brief: {
          status: briefResponse.status,
          result: briefResult
        }
      },
      testData: {
        questionnaire: testQuestionnaireData,
        brief: testBriefData
      }
    });

  } catch (error) {
    console.error('Error testing notifications:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET to run the test'
  }, { status: 405 });
}
