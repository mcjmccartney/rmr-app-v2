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
    const response = await fetch('https://hook.eu1.make.com/6h3l774l7datm3dgtjojf7nvkyqp7usa', {
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
  const sectionStyle = `
    margin-bottom: 24px;
  `;

  const headerStyle = `
    background-color: #973b00;
    color: white;
    font-size: 18px;
    font-weight: bold;
    padding: 12px;
    margin-bottom: 12px;
    margin: 0 0 12px 0;
  `;

  const questionStyle = `
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
    font-size: 16px;
  `;

  const answerStyle = `
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 6px;
    color: #374151;
    margin-bottom: 16px;
    line-height: 1.5;
    white-space: pre-wrap;
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Behaviour Questionnaire Submission</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">

  <h1 style="color: #973b00; text-align: center; margin-bottom: 30px; font-size: 24px;">New Behaviour Questionnaire Submission</h1>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Owner Information</div>

    <div style="${questionStyle}">Owner Name</div>
    <div style="${answerStyle}">${data.ownerFirstName} ${data.ownerLastName}</div>

    <div style="${questionStyle}">Email</div>
    <div style="${answerStyle}">${data.email || 'Not provided'}</div>

    <div style="${questionStyle}">Contact Number</div>
    <div style="${answerStyle}">${data.contactNumber || 'Not provided'}</div>

    <div style="${questionStyle}">Address</div>
    <div style="${answerStyle}">${[data.address1, data.address2, data.city, data.stateProvince, data.zipPostalCode, data.country].filter(Boolean).join(', ') || 'Not provided'}</div>

    <div style="${questionStyle}">How did you hear about my services?</div>
    <div style="${answerStyle}">${data.howDidYouHear || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Dog Information</div>

    <div style="${questionStyle}">Dog Name</div>
    <div style="${answerStyle}">${data.dogName || 'Not provided'}</div>

    <div style="${questionStyle}">Age</div>
    <div style="${answerStyle}">${data.age || 'Not provided'}</div>

    <div style="${questionStyle}">Sex</div>
    <div style="${answerStyle}">${data.sex || 'Not provided'}</div>

    <div style="${questionStyle}">What breed is your dog?</div>
    <div style="${answerStyle}">${data.breed || 'Not provided'}</div>

    <div style="${questionStyle}">Neutered/Spayed? At what age?</div>
    <div style="${answerStyle}">${data.neuteredSpayed || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Behaviour Concerns</div>

    <div style="${questionStyle}">What is the main thing you would like help with?</div>
    <div style="${answerStyle}">${data.mainHelp || 'Not provided'}</div>

    <div style="${questionStyle}">When did you first notice tendencies of this behaviour?</div>
    <div style="${answerStyle}">${data.firstNoticed || 'Not provided'}</div>

    <div style="${questionStyle}">When, where and how often does it happen? Be specific</div>
    <div style="${answerStyle}">${data.whenWhereHow || 'Not provided'}</div>

    <div style="${questionStyle}">Has there been a recent change in the behaviour? (More frequent? More intense? Different circumstances?)</div>
    <div style="${answerStyle}">${data.recentChange || 'Not provided'}</div>

    <div style="${questionStyle}">Can you anticipate when it is likely to happen? (Location, who is present, trigger, etc.)</div>
    <div style="${answerStyle}">${data.canAnticipate || 'Not provided'}</div>

    <div style="${questionStyle}">Why do you think your dog is doing this?</div>
    <div style="${answerStyle}">${data.whyThinking || 'Not provided'}</div>

    <div style="${questionStyle}">What have you done so far to address this problem? With what effect?</div>
    <div style="${answerStyle}">${data.whatDoneSoFar || 'Not provided'}</div>

    <div style="${questionStyle}">What would you consider your ideal goal/outcome of a training program?</div>
    <div style="${answerStyle}">${data.idealGoal || 'Not provided'}</div>

    <div style="${questionStyle}">Is there anything else you would like help with if possible?</div>
    <div style="${answerStyle}">${data.anythingElse || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Health and Veterinary</div>

    <div style="${questionStyle}">Does your dog have any past relevant medical or health conditions or important medical history? If yes, please describe. (Allergies, medication, injury etc.)</div>
    <div style="${answerStyle}">${data.medicalHistory || 'Not provided'}</div>

    <div style="${questionStyle}">Have you specifically asked your Veterinarian about any of your dog's training and behaviour concerns? If yes, what was their advice?</div>
    <div style="${answerStyle}">${data.vetAdvice || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Background</div>

    <div style="${questionStyle}">Where did you get your dog from? (E.g. breeder, rescue centre, ex-street dog)</div>
    <div style="${answerStyle}">${data.whereGotDog || 'Not provided'}</div>

    <div style="${questionStyle}">If your dog was a rescue, what do you know about their background?</div>
    <div style="${answerStyle}">${data.rescueBackground || 'Not provided'}</div>

    <div style="${questionStyle}">How old was your dog when you got him/her?</div>
    <div style="${answerStyle}">${data.ageWhenGot || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Feeding</div>

    <div style="${questionStyle}">What do you feed your dog? Please be specific (Brand, variety, canned, dried, raw, home cooked, etc.)</div>
    <div style="${answerStyle}">${data.whatFeed || 'Not provided'}</div>

    <div style="${questionStyle}">How food motivated is your dog? (1 - 10, 10 being highly food motivated)</div>
    <div style="${answerStyle}">${data.foodMotivation || 'Not provided'}</div>

    <div style="${questionStyle}">Please describe your dog's mealtime. (Where, when, how often, who feeds, special routine, etc.)</div>
    <div style="${answerStyle}">${data.mealtime || 'Not provided'}</div>

    <div style="${questionStyle}">Please describe any treat routine your dog has. (Who, what kind of treat, etc.)</div>
    <div style="${answerStyle}">${data.treatRoutine || 'Not provided'}</div>

    <div style="${questionStyle}">If applicable, are you happy for me to give your dog treats I bring along? If no, please have some to hand that you are happy for me to use.</div>
    <div style="${answerStyle}">${data.happyForTreats || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Interaction & Exercise</div>

    <div style="${questionStyle}">What types of play do you engage in with your dog? Do they enjoy it?</div>
    <div style="${answerStyle}">${data.typesOfPlay || 'Not provided'}</div>

    <div style="${questionStyle}">Are you affectionate with your dog? Do they enjoy it?</div>
    <div style="${answerStyle}">${data.affectionate || 'Not provided'}</div>

    <div style="${questionStyle}">What types of exercise does your dog regularly get?</div>
    <div style="${answerStyle}">${data.exercise || 'Not provided'}</div>

    <div style="${questionStyle}">Does your dog use a muzzle for any reason?</div>
    <div style="${answerStyle}">${data.muzzleUse || 'Not provided'}</div>

    <div style="${questionStyle}">How does your dog react when familiar people come to your home? Please describe. (Bark, jump, mouth, calm, etc.)</div>
    <div style="${answerStyle}">${data.familiarPeople || 'Not provided'}</div>

    <div style="${questionStyle}">How does your dog react when unfamiliar people come to your home? Please describe. (Bark, jump, mouth, calm, etc.)</div>
    <div style="${answerStyle}">${data.unfamiliarPeople || 'Not provided'}</div>

    <div style="${questionStyle}">Is your dog fully housetrained?</div>
    <div style="${answerStyle}">${data.housetrained || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">General Information</div>

    <div style="${questionStyle}">What does your dog like to do aside from walks? (Enrichment, games, jobs, etc.)</div>
    <div style="${answerStyle}">${data.likesToDo || 'Not provided'}</div>

    <div style="${questionStyle}">What do you like about your dog?</div>
    <div style="${answerStyle}">${data.likeAboutDog || 'Not provided'}</div>

    <div style="${questionStyle}">What do you find most challenging about your dog?</div>
    <div style="${answerStyle}">${data.mostChallenging || 'Not provided'}</div>

    <div style="${questionStyle}">How do you let your dog know when they have done something "good"?</div>
    <div style="${answerStyle}">${data.howGood || 'Not provided'}</div>

    <div style="${questionStyle}">What are your dog's favourite rewards?</div>
    <div style="${answerStyle}">${data.favouriteRewards || 'Not provided'}</div>

    <div style="${questionStyle}">Do you let your dog know when they have done something "bad"? How?</div>
    <div style="${answerStyle}">${data.howBad || 'Not provided'}</div>

    <div style="${questionStyle}">What effect does your method of telling them they've done something bad have? (ie: no change, stopped behaviour, got worse, only worked with certain person, etc.)</div>
    <div style="${answerStyle}">${data.effectOfBad || 'Not provided'}</div>

    <div style="${questionStyle}">Has your dog participated in any professional training before? If yes, please describe. (What type of methods were used? How was your experience and the results?)</div>
    <div style="${answerStyle}">${data.professionalTraining || 'Not provided'}</div>

    <div style="${questionStyle}">How does your dog get along with other dogs?</div>
    <div style="${answerStyle}">${data.sociabilityDogs || 'Not provided'}</div>

    <div style="${questionStyle}">How does your dog get along with people?</div>
    <div style="${answerStyle}">${data.sociabilityPeople || 'Not provided'}</div>

    <div style="${questionStyle}">Is there anything else that you would like me to know about your situation or your dog?</div>
    <div style="${answerStyle}">${data.anythingElseToKnow || 'Not provided'}</div>

    <div style="${questionStyle}">How much time per week total are you able to dedicate to training?</div>
    <div style="${answerStyle}">${data.timePerWeek || 'Not provided'}</div>
  </div>

  <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #973b00; color: white;">
    <p style="margin: 0; font-size: 14px;">Submitted: ${new Date().toLocaleString()}</p>
  </div>

</body>
</html>
`;
}

function formatBehaviouralBriefEmail(data: any): string {
  const sectionStyle = `
    margin-bottom: 24px;
  `;

  const headerStyle = `
    background-color: #973b00;
    color: white;
    font-size: 18px;
    font-weight: bold;
    padding: 12px;
    margin-bottom: 12px;
    margin: 0 0 12px 0;
  `;

  const questionStyle = `
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
    font-size: 16px;
  `;

  const answerStyle = `
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 6px;
    color: #374151;
    margin-bottom: 16px;
    line-height: 1.5;
    white-space: pre-wrap;
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Behavioural Brief Submission</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">

  <h1 style="color: #973b00; text-align: center; margin-bottom: 30px; font-size: 24px;">New Behavioural Brief Submission</h1>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Owner Information</div>

    <div style="${questionStyle}">Owner Name</div>
    <div style="${answerStyle}">${data.ownerFirstName} ${data.ownerLastName}</div>

    <div style="${questionStyle}">Email</div>
    <div style="${answerStyle}">${data.email || 'Not provided'}</div>

    <div style="${questionStyle}">Contact Number</div>
    <div style="${answerStyle}">${data.contactNumber || 'Not provided'}</div>

    <div style="${questionStyle}">Postcode</div>
    <div style="${answerStyle}">${data.postcode || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Dog Information</div>

    <div style="${questionStyle}">Dog Name</div>
    <div style="${answerStyle}">${data.dogName || 'Not provided'}</div>

    <div style="${questionStyle}">Sex</div>
    <div style="${answerStyle}">${data.sex || 'Not provided'}</div>

    <div style="${questionStyle}">What breed is your dog? (Unknown/mixed is fine :-)</div>
    <div style="${answerStyle}">${data.breed || 'Not provided'}</div>
  </div>

  <div style="${sectionStyle}">
    <div style="${headerStyle}">Consultation Details</div>

    <div style="${questionStyle}">In general, how is life with your dog, and what would you like help with? (New puppy, new dog, new rescue, general training, behaviour concern, etc.)</div>
    <div style="${answerStyle}">${data.lifeWithDog || 'Not provided'}</div>

    <div style="${questionStyle}">What would be the best outcome for you and your dog? (E.g. a better relationship, a happier dog, an easier home life, more relaxed walks, etc.)</div>
    <div style="${answerStyle}">${data.bestOutcome || 'Not provided'}</div>

    <div style="${questionStyle}">Which type of session would you ideally like?</div>
    <div style="${answerStyle}">${data.sessionType || 'Not provided'}</div>
  </div>

  <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #973b00; color: white;">
    <p style="margin: 0; font-size: 14px;">Submitted: ${new Date().toLocaleString()}</p>
  </div>

</body>
</html>
`;
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { message: 'Notification endpoint - POST only' },
    { status: 405 }
  );
}
