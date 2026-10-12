# Question-bank summary: Open Trivia DB and DOE Science Bowl

Data downloaded 2026-10-12 into a temp folder (not committed). Counts are from my own scripts; see "Method and caveats".

## 1. Open Trivia DB (opentdb.com)

Fetched **5163** of the **5,299** verified questions the API reports (97%). All 24 categories are present. The remaining 136 questions (3%) were not returned by the API with my token/de-dup settings; categories with no gap are complete.

By difficulty (all categories fetched): easy **1728**, medium **2366**, hard **1069**. Type: multiple choice 4394, true/false 769.

| Category | Easy | Medium | Hard | Fetched | Verified (API) |
|---|---|---|---|---|---|
| Entertainment: Video Games | 406 | 545 | 227 | 1178 | 1186 |
| Entertainment: Music | 132 | 266 | 83 | 481 | 495 |
| General Knowledge | 212 | 175 | 67 | 454 | 469 |
| History | 86 | 208 | 101 | 395 | 411 |
| Geography | 116 | 159 | 78 | 353 | 383 |
| Entertainment: Film | 112 | 132 | 49 | 293 | 301 |
| Science & Nature | 83 | 130 | 73 | 286 | 299 |
| Entertainment: Japanese Anime & Manga | 65 | 83 | 49 | 197 | 204 |
| Entertainment: Television | 70 | 88 | 31 | 189 | 196 |
| Science: Computers | 61 | 73 | 43 | 177 | 192 |
| Sports | 61 | 84 | 28 | 173 | 176 |
| Entertainment: Books | 39 | 52 | 29 | 120 | 120 |
| Entertainment: Cartoon & Animations | 40 | 45 | 23 | 108 | 108 |
| Animals | 36 | 42 | 21 | 99 | 99 |
| Vehicles | 28 | 38 | 21 | 87 | 87 |
| Science: Mathematics | 29 | 31 | 20 | 80 | 80 |
| Entertainment: Comics | 20 | 40 | 19 | 79 | 79 |
| Entertainment: Board Games | 26 | 25 | 27 | 78 | 78 |
| Politics | 22 | 36 | 19 | 77 | 77 |
| Mythology | 24 | 32 | 15 | 71 | 71 |
| Art | 19 | 19 | 21 | 59 | 59 |
| Celebrities | 13 | 32 | 8 | 53 | 53 |
| Science: Gadgets | 17 | 17 | 6 | 40 | 40 |
| Entertainment: Musicals & Theatres | 11 | 14 | 11 | 36 | 36 |

**Relevance for this project:** the school-subject categories are small: Science: Mathematics 80, Geography 353, History 395, Animals 99, Science: Computers 177. About 53% of the fetched bank is Entertainment (video games alone 1,178). Difficulty labels are crowd-assigned (easy / medium / hard), not tied to a grade level.

## 2. DOE National Science Bowl practice rounds

Source: the two official sample-question pages on science.osti.gov (MS and HS), 251 + 258 round PDFs (509 files, 74 MB). There is no difficulty field. The only difficulty-like split is **Middle School vs High School**, plus question type (Multiple Choice vs Short Answer) and Toss-up vs Bonus.

Parsed **22884** questions: 11629 middle school, 11255 high school. Toss-up and bonus are split evenly. Multiple choice 9271, short answer 13613.

### Middle school (11629)
| Subject label | Questions | Share |
|---|---|---|
| Math | 2266 | 19% |
| Earth & Space | 2252 | 19% |
| Life Science (MS) | 2200 | 19% |
| Physical Science (MS) | 2154 | 19% |
| General Science (MS) | 1359 | 12% |
| Energy | 1215 | 10% |
| Biology | 63 | 1% |
| Physics | 60 | 1% |
| Chemistry | 60 | 1% |

### High school (11255)
| Subject label | Questions | Share |
|---|---|---|
| Biology | 2024 | 18% |
| Physics | 1930 | 17% |
| Chemistry | 1930 | 17% |
| Earth & Space | 1865 | 17% |
| Math | 1852 | 16% |
| Energy | 1246 | 11% |
| Astronomy | 206 | 2% |
| General Science | 202 | 2% |

Subject labels changed over the years. Older middle-school sets use Life Science / Physical Science / General Science; newer ones use Biology, Chemistry, Physics. Older high-school sets sometimes label Astronomy or General Science. I did not merge these, so shares are by the label printed in the PDF.

## 3. Method and caveats
- Open Trivia DB: fetched through the public API with a session token, at most one request per 5 seconds, de-duplicated by question text (5163 rows, 5159 unique texts). I have not verified answers or checked licensing (the DB is published under CC BY-SA 4.0 per its own site; confirm before reuse).
- Science Bowl: text extracted with `pdftotext -layout`, questions counted by matching the "TOSS-UP/BONUS, N) Subject – type" header. **17 of 509 files did not match** (HS Sample Set 2, a different layout), so their questions are missing. Counts may also include questions duplicated across overlapping sample sets. The pages state no license; the questions belong to DOE, so I kept only the statistics here, not the questions.
