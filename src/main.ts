import {setFailed} from '@actions/core'

function run() {
  try {
    console.log
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
