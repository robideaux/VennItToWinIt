// Simulates App's history handling to confirm the back path no longer lands on a
// results screen without its puzzle.
const stack = []; let idx = -1
const push    = st => { stack.splice(idx+1); stack.push(st); idx = stack.length-1 }
const replace = st => { stack[idx] = st }
const back    = () => { if (idx > 0) idx--; return stack[idx] }
const here    = () => stack[idx]

function run(label, startVia) {
  let activePuzzle = null
  stack.length = 0; idx = -1
  replace({screen:'home'}); push({screen:'home'}); idx = 0; stack.length = 1

  if (startVia === 'selector') { push({screen:'selector'}) }
  activePuzzle = {id:'p1'};  push({screen:'game'})
  replace({screen:'gameover'})                       // handleGameOver
  push({screen:'selector'})                          // "New Puzzle"  (activePuzzle kept)

  const steps = []
  let guard = 0
  while (guard++ < 6) {
    const st = back()
    const broken = (st.screen === 'win' || st.screen === 'gameover') && !activePuzzle
    steps.push(`${st.screen}${broken ? '  <-- BLANK PAGE' : ''}`)
    if (st.screen === 'home') break
  }
  console.log(`  ${label}`)
  console.log(`    stack : ${stack.map(s=>s.screen).join(' > ')}`)
  console.log(`    backs : ${steps.join('  ->  ')}`)
}

console.log('AFTER FIX (activePuzzle retained):')
run('started from Home > All Venns', 'selector')
run('started from Home > Play Latest', 'latest')

console.log('\nBEFORE FIX (activePuzzle nulled on "New Puzzle"):')
{
  stack.length = 0; idx = -1
  stack.push({screen:'home'}); idx = 0
  push({screen:'selector'}); push({screen:'game'}); replace({screen:'gameover'})
  let activePuzzle = null                             // <-- what the old code did
  push({screen:'selector'})
  const st = back()
  console.log(`  stack : ${stack.map(s=>s.screen).join(' > ')}`)
  console.log(`  back  : ${st.screen}  <-- renders GameOverScreen with puzzle=null -> TypeError`)
}
