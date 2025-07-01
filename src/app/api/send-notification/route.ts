import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received notification request:', body);

    const { type, data } = body;

    // Validate required fields
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing type or data' },
        { status: 400 }
      );
    }

    let emailContent = '';
    let subject = '';

    if (type === 'behaviour_questionnaire') {
      subject = `New Behaviour Questionnaire Submitted - ${data.dogName}`;
      emailContent = formatBehaviourQuestionnaireEmail(data);
    } else if (type === 'behavioural_brief') {
      subject = `New Behavioural Brief Submitted - ${data.dogName}`;
      emailContent = formatBehaviouralBriefEmail(data);
    } else {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Send email via Make.com webhook
    const emailData = {
      to: 'raisingmyrescue@outlook.com',
      subject: subject,
      content: emailContent,
      type: type,
      submittedAt: new Date().toISOString()
    };

    console.log('Sending email notification via Make.com:', { subject, type });

    // Call Make.com webhook for email notifications
    // TODO: Replace with actual Make.com webhook URL for email notifications
    const response = await fetch('https://hook.eu1.make.com/REPLACE_WITH_ACTUAL_WEBHOOK_URL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      console.error('Failed to send email notification:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to send email notification' },
        { status: 500 }
      );
    }

    console.log('Email notification sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function formatBehaviourQuestionnaireEmail(data: any): string {
  return `
New Behaviour Questionnaire Submission

OWNER INFORMATION:
Name: ${data.ownerFirstName} ${data.ownerLastName}
Email: ${data.email}
Phone: ${data.contactNumber}
Address: ${data.address1}${data.address2 ? ', ' + data.address2 : ''}, ${data.city}, ${data.stateProvince} ${data.zipPostalCode}, ${data.country}
How did you hear about us: ${data.howDidYouHear}

DOG INFORMATION:
Name: ${data.dogName}
Age: ${data.age}
Sex: ${data.sex}
Breed: ${data.breed}
Neutered/Spayed: ${data.neuteredSpayed}

MAIN CONCERNS:
What would you like help with: ${data.mainHelp}
When first noticed: ${data.firstNoticed}
When/where/how it happens: ${data.whenWhereHow}
Recent changes: ${data.recentChange}
Can you anticipate when it will happen: ${data.canAnticipate}
Why do you think this is happening: ${data.whyThinking}
What have you done so far: ${data.whatDoneSoFar}
Ideal goal: ${data.idealGoal}
Anything else: ${data.anythingElse}

HEALTH & VETERINARY:
Medical history: ${data.medicalHistory}
Vet advice: ${data.vetAdvice}

BACKGROUND:
Where did you get your dog: ${data.whereGotDog}
Rescue background: ${data.rescueBackground}
Age when you got them: ${data.ageWhenGot}

FEEDING & TREATS:
What do you feed: ${data.whatFeed}
Food motivated: ${data.foodMotivated}
Mealtime routine: ${data.mealtime}
Treat routine: ${data.treatRoutine}
Happy with treats: ${data.happyWithTreats}

PLAY & EXERCISE:
Types of play: ${data.typesOfPlay}
Affectionate: ${data.affectionate}
Exercise routine: ${data.exercise}
Use muzzle: ${data.useMuzzle}

SOCIAL BEHAVIOR:
With familiar people: ${data.familiarPeople}
With unfamiliar people: ${data.unfamiliarPeople}
Housetrained: ${data.housetrained}

GENERAL:
What they like to do: ${data.likesToDo}
What you like about your dog: ${data.likeAboutDog}
Most challenging aspect: ${data.mostChallenging}
How good are they at: ${data.howGood}
Favourite rewards: ${data.favouriteRewards}
How bad is the problem: ${data.howBad}
Effect of the problem: ${data.effectOfBad}
Professional training experience: ${data.professionalTraining}
Sociability with dogs: ${data.sociabilityDogs}
Sociability with people: ${data.sociabilityPeople}
Anything else to know: ${data.anythingElseToKnow}
Time available per week: ${data.timePerWeek}

Submitted: ${new Date().toLocaleString()}
`;
}

function formatBehaviouralBriefEmail(data: any): string {
  return `
New Behavioural Brief Submission

OWNER INFORMATION:
Name: ${data.ownerFirstName} ${data.ownerLastName}
Email: ${data.email}
Phone: ${data.contactNumber}
Postcode: ${data.postcode}

DOG INFORMATION:
Name: ${data.dogName}
Sex: ${data.sex}
Breed: ${data.breed}

CONSULTATION DETAILS:
Life with dog & help needed: ${data.lifeWithDog}
Best outcome hoped for: ${data.bestOutcome}
Session type preference: ${data.sessionType}

Submitted: ${new Date().toLocaleString()}
`;
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'Notification endpoint - POST only' },
    { status: 405 }
  );
}
