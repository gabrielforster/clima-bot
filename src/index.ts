
import { createInterface } from "readline/promises"

abstract class Question {
  constructor(
    protected readonly rl: ReturnType<typeof createInterface>,
    protected readonly question?: string,
    protected readonly answers: string[] = [],
    protected paths: Record<typeof this.answers[number], Question> = {},
    protected readonly callOnNoAnswer: Question | null = null,
    protected onExitCall: Question | null = null,
  ) { }

  async run(previusAnswer?: string): Promise<string | null> {
    const answer = await this.internalRun(previusAnswer)

    if (answer === null) {
      return null
    } else if (answer === "exit") {
      if (this.onExitCall) {
        return this.onExitCall.run(answer)
      } else {
        console.log("Exiting...")
        return null
      }
    }

    if (this.answers.length === 0 || Object.keys(this.paths).length === 0) {
      return answer
    }

    const nextQuestion = this.paths[answer]
    if (nextQuestion) {
      return nextQuestion.run(answer)
    }

    return answer
  }

  abstract internalRun(previusAnswer?: string): Promise<string | null>

  setPaths(paths: Record<typeof this.answers[number], Question>) {
    this.paths = paths
  }
}

class WheaterQuestion extends Question {
  async internalRun(previusAnswer?: string): Promise<string | null> {
    const text = "What city do you want to know the weather for?"
    const city = await this.rl.question(text + "\nAnswer: ")

    const wheater = await this.fetchWeather(city)

    return `The weather in ${city} is: ${wheater}`
  }

  async fetchWeather(city: string): Promise<string> {
    // TODO: implement whater fetching
    return "nice"
  }
}

class MenuQuestion extends Question {
  async internalRun(previusAnswer?: string): Promise<string | null> {
    const text = this.question || "What do you want to do?"
    const options = this.answers.map((answer, index) => `${index + 1}. ${answer}`).join("\n")
    const answer = await this.rl.question(`${text}\n${options}\nAnswer: `)
    return answer;
  }
}

function mountAppFlow(rl: ReturnType<typeof createInterface>): Question {
  const hiQuestion = new MenuQuestion(rl, "Hi! What do you want to do?", ["Get weather", "Exit"])
  const weatherQuestion = new WheaterQuestion(rl, "What city do you want to know the weather for?", [], {}, hiQuestion)
  const exitQuestion = new MenuQuestion(rl, "Are you sure you want to exit?", ["Yes", "No"], {}, null)

  hiQuestion.setPaths({
    "1": weatherQuestion,
    "2": exitQuestion
  })

  weatherQuestion.setPaths({
    "exit": exitQuestion
  })

  return hiQuestion
}

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  })

  const oldRlQuestion = rl.question

  rl.question = (question: string) => {
    const newQuestion = `\n${question}`
    return oldRlQuestion.bind(rl)(newQuestion)
  }

  try {
    const flow = mountAppFlow(rl)
    console.info("starting app \n")

    let answer: string | null = null
    do {
      answer = await flow.run()
      console.info(answer)
    } while(answer !== null)

    console.info("\napp finished")
  } catch (err) {
    console.error("error reading input:", err)
    console.info("closing app")
  } finally {
    rl.close()
  }
}
main()
