# =========================================================================
#  Claude Code 전역 스킬 설치 — 박성준 PC (Windows PowerShell 5.1 / 7 둘 다)
#  (2026-11-23 본인 「어썸디자인도 설치해줘 · lazyowen.com 가이드 참고해 전체적으로 자동 설치 · 필요한 것들 클로드에 보강」)
#
#  실행 (저장소 폴더에서):
#    powershell -ExecutionPolicy Bypass -File tools\claude-setup\install-global.ps1            # 기본 묶음
#    powershell -ExecutionPolicy Bypass -File tools\claude-setup\install-global.ps1 -DryRun    # 명령만 보기
#    powershell -ExecutionPolicy Bypass -File tools\claude-setup\install-global.ps1 -Marketing # + 마케팅 스킬 53개(플러그인)
#
#  하는 일: 아래 스킬을 %USERPROFILE%\.claude\skills 에 한 개씩 설치(이미 있으면 건너뜀 — 덮어쓰지 않음)하고 확인한다.
#  모든 폴더의 Claude Code 에 적용된다. 설치 뒤 Claude Code 를 완전히 껐다 켠다.
#  되돌리기: %USERPROFILE%\.claude\skills\<이름> 폴더를 지운다. agent-browser 는 npm uninstall -g agent-browser.
#  .env 같은 비밀 파일은 읽지 않는다. 설명 · 출처 · 검토 내용은 tools\claude-setup\README.md
# =========================================================================
param(
  [switch]$DryRun,
  [switch]$Marketing,   # coreyhaines31/marketingskills — 마케팅 스킬 53개(CRO · 카피 · SEO · 광고 · 분석 …) 플러그인
  [switch]$NoBrowser    # agent-browser 명령줄 도구 · 자동화용 크롬 내려받기를 건너뜀
)
$ErrorActionPreference = 'Continue'
$skillsDir = Join-Path $env:USERPROFILE '.claude\skills'
$log = New-Object System.Collections.Generic.List[string]
function Say($m, $c = 'Gray') { Write-Host $m -ForegroundColor $c }
function Has($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Ver($c) { if (Has $c) { (& $c --version 2>$null | Select-Object -First 1) } else { $null } }
function Run($cmd) {
  $log.Add($cmd)
  if ($DryRun) { Say "  (dry-run) $cmd" 'DarkGray'; return 0 }
  Say "  > $cmd" 'DarkGray'
  cmd /c $cmd | Out-Host          # 출력은 화면으로, 함수 값은 종료 코드만
  return $LASTEXITCODE
}

# ---------------------------------------------------------------- 1. 준비물
Say "`n[1/4] 준비물 확인" 'Cyan'
$node = Ver 'node'
if (-not $node) { Say "  Node.js 가 없습니다 — https://nodejs.org 에서 LTS 설치 뒤 새 PowerShell 에서 다시." 'Red'; exit 1 }
$v = $node.TrimStart('v').Split('.') | ForEach-Object { [int]$_ }
if ($v[0] -lt 22 -or ($v[0] -eq 22 -and $v[1] -lt 20)) { Say "  Node $node — 22.20 이상이 필요합니다(브라우저 도구는 24 이상 권장)." 'Red'; exit 1 }
Say "  Node $node" 'Green'
$claude = Ver 'claude'
if ($claude) { Say "  Claude Code $claude" 'Green' } else { Say "  claude 명령이 안 보입니다 — 스킬은 설치되지만 -Marketing(플러그인)은 건너뜁니다." 'Yellow' }

# ---------------------------------------------------------------- 2. 스킬 (전역 · 복사 설치)
# 순서 = 가이드 「클로드한테 디자인 시키기 전에 깔아야 하는 5개」 + 「AI 티 안 나는 웹사이트」 + 「채용 심사단」 + 「처음 세팅(humanizer)」 + 「find-skills」
$skills = @(
  @{ name = 'design-taste-frontend'; src = 'https://github.com/Leonxlnx/taste-skill'; note = 'Taste — 새 랜딩 · 회사 사이트용. 포트폴리오 저장소에는 쓰지 않음(README)' },
  @{ name = 'web-design-guidelines'; src = 'vercel-labs/agent-skills';            note = 'Vercel 웹 인터페이스 규칙으로 배포 전 검사' },
  @{ name = 'emil-design-eng';       src = 'emilkowalski/skills';                 note = '움직임 · 누름 · 마우스 반응 다듬기' },
  @{ name = 'agent-browser';         src = 'vercel-labs/agent-browser';           note = '클로드가 만든 화면을 직접 열어 보기(아래 CLI 필요)' },
  @{ name = 'find-skills';           src = 'vercel-labs/skills';                  note = '필요한 스킬 찾아 주기' },
  @{ name = 'humanizer';             src = 'blader/humanizer';                    note = 'AI 티 나는 문장 패턴 걷어내기(영어 기준 — 대구 · 줄표 · 셋 나열 같은 구조는 한국어에도)' },
  @{ name = 'hiring-panel';          src = 'alexyc9381/hiring-panel-skill';       note = '/hiring-panel — 심사 7명이 이력서를 떨어뜨리려 읽고 고친 판' }
)
Say "`n[2/4] 스킬 $($skills.Count)개 → $skillsDir" 'Cyan'
$ok = @(); $skip = @(); $fail = @()
foreach ($s in $skills) {
  $dir = Join-Path $skillsDir $s.name
  if (Test-Path (Join-Path $dir 'SKILL.md')) { Say "  - $($s.name): 이미 있음 — 건너뜀" 'DarkYellow'; $skip += $s.name; continue }
  Say "  + $($s.name) — $($s.note)"
  if ($s.name -eq 'agent-browser') { $cmd = "npx --yes skills@latest add $($s.src) --agent claude-code --yes --copy -g" }
  else { $cmd = "npx --yes skills@latest add $($s.src) --skill $($s.name) --agent claude-code --yes --copy -g" }
  $code = Run $cmd
  if ($DryRun -or (Test-Path (Join-Path $dir 'SKILL.md'))) { $ok += $s.name } else { $fail += "$($s.name) (종료 코드 $code)" }
}

# ---------------------------------------------------------------- 3. agent-browser 명령줄 도구 · 마케팅 플러그인
Say "`n[3/4] 도구" 'Cyan'
if ($NoBrowser) { Say "  agent-browser CLI — 건너뜀(-NoBrowser)" 'DarkYellow' }
else {
  $ab = Ver 'agent-browser'
  if ($ab) { Say "  agent-browser $ab — 이미 있음" 'DarkYellow' }
  else {
    Run "npm install -g agent-browser" | Out-Null
    Run "agent-browser install" | Out-Null          # 자동화 전용 크롬(평소 크롬과 따로)
  }
}
if ($Marketing) {
  if (-not $claude) { Say "  마케팅 플러그인 — claude 명령이 없어 건너뜀" 'Yellow' }
  else {
    Run "claude plugin marketplace add coreyhaines31/marketingskills" | Out-Null
    Run "claude plugin install marketing-skills@marketingskills" | Out-Null
  }
}

# ---------------------------------------------------------------- 4. 확인
Say "`n[4/4] 확인" 'Cyan'
if (-not $DryRun) {
  Get-ChildItem $skillsDir -Directory -ErrorAction SilentlyContinue | ForEach-Object { Say ("  " + $_.Name) }
  $ab = Ver 'agent-browser'; if ($ab) { Say "  agent-browser $ab" 'Green' } elseif (-not $NoBrowser) { Say "  agent-browser 버전이 안 나옵니다 — 새 PowerShell 에서 'agent-browser doctor'" 'Yellow' }
  if ($Marketing -and $claude) { & claude plugin list }
}
Say ("`n설치 {0} · 건너뜀 {1} · 실패 {2}" -f $ok.Count, $skip.Count, $fail.Count) 'Cyan'
if ($fail.Count) { $fail | ForEach-Object { Say "  실패: $_" 'Red' }; Say "  같은 명령을 한 번 더 · 회사망이면 github.com · registry.npmjs.org 접근 확인" 'Yellow' }
Say "Claude Code 를 완전히 껐다 켜면 새 스킬이 보입니다. 쓰는 순서 · 예시 요청은 tools\claude-setup\README.md" 'Cyan'
if ($fail.Count) { exit 1 }
