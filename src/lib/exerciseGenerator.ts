import {
  CompareExercise,
  ContextExercise,
  DisplayTerm,
  ExactNum,
  Exercise,
  ExerciseCategory,
  FindExponentExercise,
  Level,
  OperationExercise,
  PracticeFilter,
} from '../types/exercise';
import {
  addExact,
  compareExact,
  divExact,
  formatExactAsDecimal,
  formatMantissaAtExponent,
  formatSciUnicode,
  mulExact,
  normalizeExact,
  simplifyExact,
  subExact,
  toSuperscript,
} from './sciMath';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}-${Math.floor(Math.random() * 1000)}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeExact(coeff: number | bigint, exp: number): ExactNum {
  return simplifyExact({ coeff: BigInt(coeff), exp });
}

/**
 * Generates a clean mantissa integer and decimal scale:
 * e.g., digits=2 -> coeff in [11..99], expOffset=-1 => 1.1..9.9 (avoiding multiples of 10 if needed)
 */
function randomSciValue(
  minExp: number,
  maxExp: number,
  sigDigits: 1 | 2 | 3,
  allowNegative = false
): ExactNum {
  const targetExp = randInt(minExp, maxExp);
  let coeffNum: number;
  if (sigDigits === 1) {
    coeffNum = randInt(1, 9);
  } else if (sigDigits === 2) {
    coeffNum = randInt(11, 99);
    if (coeffNum % 10 === 0) coeffNum += randInt(1, 9);
  } else {
    coeffNum = randInt(101, 999);
    if (coeffNum % 10 === 0) coeffNum += randInt(1, 8);
  }
  const sign = allowNegative && Math.random() < 0.45 ? -1 : 1;
  return simplifyExact({
    coeff: BigInt(sign * coeffNum),
    exp: targetExp - (sigDigits - 1),
  });
}

function formatDisplayTermText(term: DisplayTerm): string {
  if (term.kind === 'decimal') {
    return formatExactAsDecimal(term.value);
  }
  if (term.kind === 'unnormalized_sci' && term.rawMantissa !== undefined && term.rawExp !== undefined) {
    return `${term.rawMantissa} × 10${toSuperscript(term.rawExp)}`;
  }
  return formatSciUnicode(term.value);
}

// ============================================================================
// 1. COMPARE EXERCISES
// ============================================================================
export function generateCompareExercise(level: Level): CompareExercise {
  const modeRoll = Math.random();

  let left: DisplayTerm;
  let right: DisplayTerm;
  const steps: string[] = [];
  let hint = '';

  if (level === 1) {
    const exp = randInt(-3, 5);
    const sig: 1 | 2 = Math.random() < 0.5 ? 1 : 2;
    const base = randomSciValue(exp === 0 ? 2 : exp, exp === 0 ? 4 : exp, sig);
    const normBase = normalizeExact(base);

    let other: ExactNum;
    if (modeRoll < 0.28) {
      // Equal!
      other = base;
    } else if (modeRoll < 0.64) {
      // Different exponent by ±1 (same or similar mantissa)
      const deltaExp = Math.random() < 0.5 ? 1 : -1;
      other = simplifyExact({ coeff: base.coeff, exp: base.exp + deltaExp });
    } else {
      // Same exponent, different mantissa
      const otherCoeff = randInt(1, 9) * 10 + randInt(1, 9);
      other = simplifyExact({
        coeff: BigInt(otherCoeff),
        exp: normBase.exp - 1,
      });
    }

    const leftIsDecimal = Math.random() < 0.5;
    left = { kind: leftIsDecimal ? 'decimal' : 'sci', value: base };
    right = { kind: leftIsDecimal ? 'sci' : 'decimal', value: other };

    hint =
      'Passa els dos nombres al mateix format (tots dos en notació científica o tots dos en decimal) per comparar-los sense errors.';
  } else if (level === 2) {
    if (modeRoll < 0.45) {
      // Decimal vs Sci with tricky exponents (-6 to -2 or 5 to 8)
      const isSmall = Math.random() < 0.55;
      const exp = isSmall ? randInt(-6, -2) : randInt(5, 8);
      const base = randomSciValue(exp, exp, 2);
      const variant = Math.random();
      let other: ExactNum;
      if (variant < 0.25) {
        other = base;
      } else if (variant < 0.7) {
        // Off by 1 power of 10 — classic zero-counting check
        other = simplifyExact({
          coeff: base.coeff,
          exp: base.exp + (Math.random() < 0.5 ? 1 : -1),
        });
      } else {
        // Larger mantissa, smaller exponent trap!
        const norm = normalizeExact(base);
        const bigMantissa = randInt(7, 9) * 10 + randInt(1, 9);
        other = simplifyExact({ coeff: BigInt(bigMantissa), exp: norm.exp - 2 });
      }
      const leftDecimal = Math.random() < 0.5;
      left = { kind: leftDecimal ? 'decimal' : 'sci', value: base };
      right = { kind: leftDecimal ? 'sci' : 'decimal', value: other };
    } else {
      // Sci vs Sci trap: bigger mantissa, smaller exponent
      const expA = randInt(-6, 7);
      const expB = expA + (Math.random() < 0.5 ? 1 : -1);
      const smallMantissa = randInt(12, 34);
      const largeMantissa = randInt(68, 97);

      const valA = simplifyExact({
        coeff: BigInt(expA > expB ? smallMantissa : largeMantissa),
        exp: expA - 1,
      });
      const valB = simplifyExact({
        coeff: BigInt(expB > expA ? smallMantissa : largeMantissa),
        exp: expB - 1,
      });
      left = { kind: 'sci', value: valA };
      right = { kind: 'sci', value: valB };
    }

    hint =
      'Quan dos nombres positius estan en notació científica, sempre és més gran el que té l’exponent de 10 més gran (encara que la mantissa sembli més petita).';
  } else {
    // Level 3: Unnormalized scientific vs standard, or negative scientific numbers!
    if (modeRoll < 0.55) {
      const exp = randInt(-7, 7);
      const base = randomSciValue(exp, exp, 3);
      const norm = normalizeExact(base);

      // Build unnormalized form by shifting exponent by +1, +2, -1, or -2
      const shift = pick([-2, -1, 1, 2]);
      const rawExp = norm.exp - shift;
      const rawMantissaVal = simplifyExact({ coeff: base.coeff, exp: base.exp - rawExp });
      const rawMantissaStr = formatExactAsDecimal(rawMantissaVal, false);

      let rightVal = base;
      const isEqual = Math.random() < 0.34;
      if (!isEqual) {
        rightVal = simplifyExact({
          coeff: base.coeff,
          exp: base.exp + pick([-1, 1]),
        });
      }

      const unnormLeft = Math.random() < 0.5;
      const unnormTerm: DisplayTerm = {
        kind: 'unnormalized_sci',
        value: base,
        rawMantissa: rawMantissaStr,
        rawExp,
      };
      const otherTerm: DisplayTerm = {
        kind: Math.random() < 0.5 ? 'sci' : 'decimal',
        value: rightVal,
      };

      left = unnormLeft ? unnormTerm : otherTerm;
      right = unnormLeft ? otherTerm : unnormTerm;
      hint =
        'Normalitza primer qualsevol expressió perquè la mantissa estigui entre 1 i 10, i tot seguit compara els exponents.';
    } else {
      // Negative numbers comparison!
      const expA = randInt(-4, 5);
      const expB = expA + pick([-1, 0, 1]);
      const valA = randomSciValue(expA, expA, 2, true);
      const valB =
        valA.coeff < 0n
          ? simplifyExact({
              coeff: -BigInt(randInt(15, 95)),
              exp: expB - 1,
            })
          : randomSciValue(expB, expB, 2, true);
      left = { kind: 'sci', value: valA };
      right = { kind: Math.random() < 0.4 ? 'decimal' : 'sci', value: valB };
      hint =
        'Compte amb els nombres negatius! En la recta numèrica, un nombre negatiu amb valor absolut més gran és en realitat més petit.';
    }
  }

  const cmp = compareExact(left.value, right.value);
  const correctRelation: '<' | '=' | '>' = cmp < 0 ? '<' : cmp > 0 ? '>' : '=';

  steps.push(
    `Expressió esquerra en notació científica estàndard: ${formatSciUnicode(left.value)} (decimal: ${formatExactAsDecimal(left.value)}).`
  );
  steps.push(
    `Expressió dreta en notació científica estàndard: ${formatSciUnicode(right.value)} (decimal: ${formatExactAsDecimal(right.value)}).`
  );
  if (correctRelation === '=') {
    steps.push('Tots dos representen exactament el mateix valor, per tant la relació és =.');
  } else {
    steps.push(
      `Comparant els dos valors, ${formatDisplayTermText(left)} ${correctRelation} ${formatDisplayTermText(right)}.`
    );
  }

  return {
    id: nextId('cmp'),
    category: 'compare',
    level,
    prompt: 'Quin signe de comparació fa certa la relació?',
    left,
    right,
    correctRelation,
    steps,
    hint,
  };
}

// ============================================================================
// 2. FIND EXPONENT & CONVERSION EXERCISES
// ============================================================================
export function generateFindExponentExercise(level: Level): FindExponentExercise {
  const roll = Math.random();
  let subMode: FindExponentExercise['subMode'] = 'missing_exp';

  if (level === 1) {
    subMode = roll < 0.65 ? 'missing_exp' : 'full_convert';
  } else if (level === 2) {
    if (roll < 0.4) subMode = 'missing_exp';
    else if (roll < 0.7) subMode = 'adjust_exp';
    else if (roll < 0.85) subMode = 'missing_mantissa';
    else subMode = 'full_convert';
  } else {
    if (roll < 0.3) subMode = 'missing_exp';
    else if (roll < 0.65) subMode = 'adjust_exp';
    else if (roll < 0.85) subMode = 'missing_mantissa';
    else subMode = 'full_convert';
  }

  const minExp = level === 1 ? -4 : level === 2 ? -7 : -10;
  const maxExp = level === 1 ? 6 : level === 2 ? 9 : 11;
  let exp = randInt(minExp, maxExp);
  if (exp === 0 || exp === 1) exp = pick([-3, -2, 3, 4, 5]);

  const sig: 1 | 2 | 3 = level === 1 ? (Math.random() < 0.5 ? 1 : 2) : level === 2 ? 2 : 3;
  const val = randomSciValue(exp, exp, sig, level === 3 && Math.random() < 0.3);
  const norm = normalizeExact(val);

  if (subMode === 'missing_exp') {
    const directionText =
      norm.exp > 0
        ? `La coma decimal es desplaça ${norm.exp} posicions cap a l’esquerra fins a obtenir ${norm.mantissa}, per tant l’exponent és +${norm.exp}.`
        : `La coma decimal es desplaça ${Math.abs(norm.exp)} posicions cap a la dreta fins a obtenir ${norm.mantissa}, per tant l’exponent és ${norm.exp}.`;

    return {
      id: nextId('exp'),
      category: 'find_exponent',
      subMode,
      level,
      prompt: 'Troba l’exponent que falta per completar la igualtat:',
      sourceTerm: { kind: 'decimal', value: val },
      targetMantissa: norm.mantissa,
      expectedValue: val,
      expectedExp: norm.exp,
      expectedMantissaStr: norm.mantissa,
      steps: [
        `Partim del nombre ${formatExactAsDecimal(val)}.`,
        directionText,
        `Resultat: ${norm.mantissa} × 10${toSuperscript(norm.exp)}.`,
      ],
      hint: 'Compta quantes posicions has de moure la coma perquè quedi exactament una xifra diferent de zero al davant.',
    };
  }

  if (subMode === 'adjust_exp') {
    const shift = pick(level === 2 ? [-2, -1, 1, 2] : [-3, -2, -1, 1, 2, 3]);
    const rawExp = norm.exp - shift;
    const rawMantissa = formatMantissaAtExponent(val, rawExp);
    const shiftDir = shift > 0 ? 'cap a l’esquerra' : 'cap a la dreta';
    const expChange = shift > 0 ? `sumem ${shift}` : `restem ${Math.abs(shift)}`;

    return {
      id: nextId('exp'),
      category: 'find_exponent',
      subMode,
      level,
      prompt: 'Normalitza el nombre i troba l’exponent resultant:',
      sourceTerm: {
        kind: 'unnormalized_sci',
        value: val,
        rawMantissa,
        rawExp,
      },
      targetMantissa: norm.mantissa,
      expectedValue: val,
      expectedExp: norm.exp,
      expectedMantissaStr: norm.mantissa,
      steps: [
        `Per passar de ${rawMantissa} a ${norm.mantissa}, movem la coma ${Math.abs(shift)} posicions ${shiftDir}.`,
        `Per mantenir el mateix valor, ${expChange} a l’exponent original (${rawExp}): ${rawExp} + (${shift}) = ${norm.exp}.`,
        `Resultat: ${norm.mantissa} × 10${toSuperscript(norm.exp)}.`,
      ],
      hint: 'Si fas la mantissa més petita movent la coma a l’esquerra, l’exponent augmenta. Si fas la mantissa més gran movent la coma a la dreta, l’exponent disminueix.',
    };
  }

  if (subMode === 'missing_mantissa') {
    const expOffset = pick([-2, -1, 1, 2]);
    const givenExp = norm.exp + expOffset;
    const expectedMantissaStr = formatMantissaAtExponent(val, givenExp);

    return {
      id: nextId('exp'),
      category: 'find_exponent',
      subMode,
      level,
      prompt: 'Troba el factor (mantissa) que falta per completar la igualtat:',
      sourceTerm: { kind: 'decimal', value: val },
      targetExp: givenExp,
      expectedValue: val,
      expectedExp: givenExp,
      expectedMantissaStr,
      steps: [
        `Volem expressar ${formatExactAsDecimal(val)} amb potència 10${toSuperscript(givenExp)}.`,
        `Dividim mentalment per 10${toSuperscript(givenExp)} (movent la coma ${Math.abs(givenExp)} posicions ${givenExp > 0 ? 'a l’esquerra' : 'a la dreta'}).`,
        `Obtenim ${expectedMantissaStr} × 10${toSuperscript(givenExp)}.`,
      ],
      hint: 'Recorda que aquí l’exponent ja ve fixat: ajusta la posició de la coma decimal fins que el producte coincideixi amb el nombre inicial.',
    };
  }

  // full_convert
  return {
    id: nextId('exp'),
    category: 'find_exponent',
    subMode: 'full_convert',
    level,
    prompt: 'Escriu aquest nombre en notació científica estàndard (1 ≤ |a| < 10):',
    sourceTerm: { kind: 'decimal', value: val },
    expectedValue: val,
    expectedExp: norm.exp,
    expectedMantissaStr: norm.mantissa,
    steps: [
      `Identifiquem les xifres significatives per formar una mantissa entre 1 i 10: ${norm.mantissa}.`,
      `Comptem el desplaçament de la coma des de ${formatExactAsDecimal(val)}: ${Math.abs(norm.exp)} posicions ${norm.exp >= 0 ? 'a l’esquerra (exponent positiu)' : 'a la dreta (exponent negatiu)'}.`,
      `Resultat: ${norm.mantissa} × 10${toSuperscript(norm.exp)}.`,
    ],
    hint: 'Col·loca la coma després de la primera xifra diferent de zero i compta els salts fins a la posició original de la coma.',
  };
}

// ============================================================================
// 3. ADDITION & SUBTRACTION EXERCISES
// ============================================================================
export function generateAddSubExercise(level: Level): OperationExercise {
  const isSub = Math.random() < 0.45;
  const operator: '+' | '-' = isSub ? '-' : '+';

  let expA: number;
  let expB: number;
  let valA: ExactNum;
  let valB: ExactNum;

  if (level === 1) {
    expA = randInt(2, 6);
    expB = expA; // Same exponent in Level 1
    valA = randomSciValue(expA, expA, 2);
    valB = randomSciValue(expB, expB, 2);
    if (isSub && compareExact(valA, valB) <= 0) {
      // Ensure positive non-zero result in Level 1
      valA = makeExact(randInt(55, 98), expA - 1);
      valB = makeExact(randInt(12, 48), expB - 1);
    }
  } else if (level === 2) {
    expA = randInt(-5, 7);
    const diff = pick([-1, 1, 2]);
    expB = expA - diff;
    valA = randomSciValue(expA, expA, 2);
    valB = randomSciValue(expB, expB, 2);
    if (isSub && compareExact(valA, valB) <= 0) {
      // Make sure A > B cleanly
      const maxE = Math.max(expA, expB);
      const minE = Math.min(expA, expB);
      valA = randomSciValue(maxE, maxE, 2);
      valB = randomSciValue(minE, minE, 2);
      if (compareExact(valA, valB) <= 0) {
        valA = makeExact(randInt(61, 95), maxE - 1);
        valB = makeExact(randInt(13, 49), minE - 1);
      }
    }
  } else {
    expA = randInt(-8, 9);
    const diff = pick([-3, -2, -1, 1, 2, 3]);
    expB = expA - diff;
    valA = randomSciValue(expA, expA, Math.random() < 0.5 ? 2 : 3);
    valB = randomSciValue(expB, expB, 2);
    // Avoid exact zero result
    if (isSub && compareExact(valA, valB) === 0) {
      valA = addExact(valA, makeExact(1, expA - 1));
    }
  }

  const expectedValue = isSub ? subExact(valA, valB) : addExact(valA, valB);
  const normA = normalizeExact(valA);
  const normB = normalizeExact(valB);
  const commonExp = Math.max(normA.exp, normB.exp);

  const mAatCommon = formatMantissaAtExponent(valA, commonExp);
  const mBatCommon = formatMantissaAtExponent(valB, commonExp);
  const unnormSum = formatMantissaAtExponent(expectedValue, commonExp);

  const steps: string[] = [];
  if (normA.exp === normB.exp) {
    steps.push(
      `Els dos termes ja tenen el mateix exponent (10${toSuperscript(commonExp)}). Operem directament les mantisses:`
    );
    steps.push(
      `(${normA.mantissa} ${operator} ${normB.mantissa}) × 10${toSuperscript(commonExp)} = ${unnormSum} × 10${toSuperscript(commonExp)}.`
    );
  } else {
    steps.push(
      `Igualem els exponents escollint l’exponent més gran (10${toSuperscript(commonExp)}):`
    );
    steps.push(
      `${formatSciUnicode(valA)} = ${mAatCommon} × 10${toSuperscript(commonExp)}  i  ${formatSciUnicode(valB)} = ${mBatCommon} × 10${toSuperscript(commonExp)}.`
    );
    steps.push(
      `Operem les mantisses: (${mAatCommon} ${operator} ${mBatCommon}) × 10${toSuperscript(commonExp)} = ${unnormSum} × 10${toSuperscript(commonExp)}.`
    );
  }

  const normRes = normalizeExact(expectedValue);
  if (normRes.exp !== commonExp) {
    steps.push(
      `Normalitzem perquè la mantissa quedi entre 1 i 10: ${formatSciUnicode(expectedValue)}.`
    );
  } else {
    steps.push(`El resultat ja està normalitzat: ${formatSciUnicode(expectedValue)}.`);
  }

  return {
    id: nextId('op'),
    category: 'add_sub',
    operator,
    level,
    prompt: `Calcula ${isSub ? 'la resta' : 'la suma'} i expressa el resultat en notació científica:`,
    left: { kind: 'sci', value: valA },
    right: { kind: 'sci', value: valB },
    expectedValue,
    steps,
    hint: 'Per sumar o restar en notació científica, primer has d’igualar les potències de 10 (per exemple, passant totes dues a l’exponent més gran).',
  };
}

// ============================================================================
// 4. MULTIPLICATION & DIVISION EXERCISES
// ============================================================================
export function generateMulDivExercise(level: Level): OperationExercise {
  const isDiv = Math.random() < 0.48;
  const operator: '×' | '÷' = isDiv ? '÷' : '×';

  let valA: ExactNum;
  let valB: ExactNum;
  let expectedValue: ExactNum;

  if (!isDiv) {
    if (level === 1) {
      const expA = randInt(1, 5);
      const expB = randInt(1, 5);
      valA = makeExact(randInt(1, 4) * 10 + pick([0, 2, 5]), expA - 1);
      valB = makeExact(randInt(2, 4), expB);
    } else if (level === 2) {
      const expA = randInt(-6, 7);
      const expB = randInt(-5, 6);
      // Often triggers mantissa >= 10 normalization
      valA = randomSciValue(expA, expA, 2);
      valB = randomSciValue(expB, expB, 1);
    } else {
      const expA = randInt(-9, 9);
      const expB = randInt(-9, 9);
      valA = randomSciValue(expA, expA, 2, Math.random() < 0.25);
      valB = randomSciValue(expB, expB, 2, Math.random() < 0.25);
    }
    expectedValue = mulExact(valA, valB);
  } else {
    // Construct clean terminating division: pick divisor B and quotient Q first, then A = B * Q!
    if (level === 1) {
      const expB = randInt(1, 4);
      const expQ = randInt(1, 4);
      const divisorM = pick([2, 3, 4, 5]);
      const quotientM = pick([12, 15, 20, 25, 30, 35, 40]);
      valB = makeExact(divisorM, expB);
      const q = makeExact(quotientM, expQ - 1);
      valA = mulExact(valB, q);
      expectedValue = q;
    } else if (level === 2) {
      const expB = randInt(-5, 6);
      const expQ = randInt(-5, 6);
      const divisorM = pick([2, 4, 5, 8, 12, 15, 25]); // clean decimal divisors (2^a * 5^b) or *3
      const quotientM =
        divisorM % 3 === 0 ? pick([12, 14, 16, 22, 24, 32]) : pick([12, 15, 25, 35, 45, 65, 75]);
      valB = makeExact(divisorM, divisorM >= 10 ? expB - 1 : expB);
      const q = makeExact(quotientM, expQ - 1);
      valA = mulExact(valB, q);
      expectedValue = q;
    } else {
      const expB = randInt(-8, 8);
      const expQ = randInt(-8, 8);
      const divisorM = pick([12, 15, 16, 24, 25, 32, 45]);
      const quotientM =
        divisorM % 3 === 0
          ? pick([125, 150, 225, 240, 325, 420])
          : pick([125, 175, 225, 275, 350, 450, 625]);
      valB = makeExact(divisorM, expB - 1);
      const sign = Math.random() < 0.25 ? -1 : 1;
      const q = makeExact(sign * quotientM, expQ - 2);
      valA = mulExact(valB, q);
      expectedValue = q;
    }
  }

  const normA = normalizeExact(valA);
  const normB = normalizeExact(valB);
  const normRes = normalizeExact(expectedValue);

  const rawMantissaNum = isDiv
    ? divExact(
        makeExact(BigInt(normA.sign) * BigInt(normA.digits), -(normA.digits.length - 1)),
        makeExact(BigInt(normB.sign) * BigInt(normB.digits), -(normB.digits.length - 1))
      )
    : mulExact(
        makeExact(BigInt(normA.sign) * BigInt(normA.digits), -(normA.digits.length - 1)),
        makeExact(BigInt(normB.sign) * BigInt(normB.digits), -(normB.digits.length - 1))
      );

  const combinedExp = isDiv ? normA.exp - normB.exp : normA.exp + normB.exp;
  const rawMantissaStr = formatExactAsDecimal(rawMantissaNum, false);

  const steps: string[] = [
    `Agrupem les mantisses i les potències de 10 per separat:`,
    isDiv
      ? `(${normA.mantissa} ÷ ${normB.mantissa}) × 10^(${normA.exp} - (${normB.exp}))`
      : `(${normA.mantissa} × ${normB.mantissa}) × 10^(${normA.exp} + (${normB.exp}))`,
    `Això dona ${rawMantissaStr} × 10${toSuperscript(combinedExp)}.`,
  ];

  if (normRes.exp !== combinedExp) {
    steps.push(
      `Ajustem la coma perquè 1 ≤ |a| < 10 i obtenim ${formatSciUnicode(expectedValue)}.`
    );
  } else {
    steps.push(`La mantissa ja compleix 1 ≤ |a| < 10: ${formatSciUnicode(expectedValue)}.`);
  }

  return {
    id: nextId('op'),
    category: 'mul_div',
    operator,
    level,
    prompt: `Calcula ${isDiv ? 'la divisió' : 'la multiplicació'} i expressa el resultat en notació científica:`,
    left: { kind: 'sci', value: valA },
    right: { kind: 'sci', value: valB },
    expectedValue,
    steps,
    hint: isDiv
      ? 'Divideix les mantisses i resta els exponents de 10 (alerta amb els signes negatius!).'
      : 'Multiplica les mantisses i suma els exponents de 10. Si la mantissa resultant passa de 10, torna a normalitzar.',
  };
}

// ============================================================================
// 5. CONTEXT WORD PROBLEMS (PARAMETRIC TEMPLATES)
// ============================================================================
export function generateContextExercise(level: Level): ContextExercise {
  const builders: Array<() => ContextExercise> =
    level === 1
      ? [
          // 1.1 Astronomia: Distància en decimal -> notació científica
          () => {
            const distMkm = pick([58, 108, 150, 228, 778, 1430]);
            const val = makeExact(distMkm, 6); // km
            const norm = normalizeExact(val);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Astronomia',
              level,
              title: 'Distàncies al sistema solar',
              story: `La distància mitjana d’un planeta respecte del Sol és d’aproximadament ${formatExactAsDecimal(val)} km.`,
              question: 'Expressa aquesta distància en quilòmetres utilitzant la notació científica.',
              answerMode: 'sci',
              unit: 'km',
              expectedValue: val,
              expectedExp: norm.exp,
              steps: [
                `Tenim ${formatExactAsDecimal(val)} km.`,
                `Col·loquem la coma darrere la primera xifra (${norm.mantissa}) i comptem ${norm.exp} posicions fins al final.`,
                `Resultat: ${formatSciUnicode(val)} km.`,
              ],
              hint: 'Escriu el nombre en format a × 10ⁿ amb 1 ≤ a < 10.',
            };
          },
          // 1.2 Biologia: Mida microscòpica -> notació científica
          () => {
            const nm = pick([12, 25, 45, 75, 85]);
            const exp = pick([-6, -7, -8]);
            const val = makeExact(nm, exp - 1);
            const norm = normalizeExact(val);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Biologia',
              level,
              title: 'Diàmetre d’un microorganisme',
              story: `Observant una mostra al microscopi electrònic, el diàmetre d’un bacteri mesura ${formatExactAsDecimal(val)} metres.`,
              question: 'Expressa aquesta longitud en notació científica.',
              answerMode: 'sci',
              unit: 'm',
              expectedValue: val,
              expectedExp: norm.exp,
              steps: [
                `Partim de ${formatExactAsDecimal(val)} m.`,
                `Movem la coma ${Math.abs(norm.exp)} posicions cap a la dreta fins a obtenir ${norm.mantissa}.`,
                `Com que és un nombre menor que 1, l’exponent és negatiu: ${formatSciUnicode(val)} m.`,
              ],
              hint: 'Per a nombres menors que 1 (0,00...), l’exponent de 10 sempre és negatiu.',
            };
          },
          // 1.3 Informàtica: Emmagatzematge en bytes (trobar exponent)
          () => {
            const tb = pick([2, 4, 5, 8]);
            const val = makeExact(tb, 12);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Informàtica',
              level,
              title: 'Capacitat d’un servidor de dades',
              story: `Un centre de dades universitari instal·la un disc de ${tb} terabytes. Sabent que 1 terabyte equival a 1 000 000 000 000 bytes (10¹² bytes), la capacitat total és ${tb} × 10ⁿ bytes.`,
              question: `Quin és l’exponent n en l’expressió ${tb} × 10ⁿ bytes?`,
              answerMode: 'exponent_only',
              expectedValue: val,
              expectedExp: 12,
              steps: [
                `1 terabyte són 10¹² bytes (un 1 seguit de 12 zeros).`,
                `Per tant, ${tb} terabytes són ${tb} × 10¹² bytes.`,
                `L’exponent buscat és 12.`,
              ],
              hint: 'Compta els zeros de 1 000 000 000 000.',
            };
          },
          // 1.4 Geografia / Ecologia: Multiplicació senzilla amb potència
          () => {
            const arbresPerKm2 = makeExact(randInt(2, 4) * 10 + 5, 3); // e.g. 25 000 -> 2.5e4
            const km2 = makeExact(randInt(2, 3), 2); // e.g. 200 -> 2e2
            const total = mulExact(arbresPerKm2, km2);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Ecologia',
              level,
              title: 'Reforestació d’un parc natural',
              story: `En una reserva forestal hi ha una densitat mitjana de ${formatSciUnicode(arbresPerKm2)} arbres per km². La reserva té una superfície de ${formatExactAsDecimal(km2)} km².`,
              question: 'Quants arbres hi ha en total a la reserva? Expressa-ho en notació científica.',
              answerMode: 'sci',
              unit: 'arbres',
              expectedValue: total,
              expectedExp: normalizeExact(total).exp,
              steps: [
                `Convertim la superfície a notació científica: ${formatExactAsDecimal(km2)} = ${formatSciUnicode(km2)}.`,
                `Multipliquem densitat per superfície: (${formatSciUnicode(arbresPerKm2)}) × (${formatSciUnicode(km2)}).`,
                `Obtenim ${formatSciUnicode(total)} arbres.`,
              ],
              hint: 'Multiplica la densitat d’arbres per la superfície total expressant totes dues dades en notació científica.',
            };
          },
        ]
      : level === 2
      ? [
          // 2.1 Física: Temps que triga la llum (d / c)
          () => {
            const secs = pick([150, 250, 400, 500, 600]);
            const c = makeExact(3, 8); // 3e8 m/s
            const t = makeExact(secs, 0);
            const dist = mulExact(c, t);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Astrofísica',
              level,
              title: 'Viatge d’un senyal làser a l’espai',
              story: `La velocitat de la llum al buit és de 3 × 10⁸ m/s. Enviem un senyal de ràdio fins a una sonda espacial situada a ${formatSciUnicode(dist)} metres de la Terra.`,
              question: 'Quants segons triga el senyal a arribar a la sonda? Expressa el temps en notació científica.',
              answerMode: 'sci',
              unit: 's',
              expectedValue: t,
              expectedExp: normalizeExact(t).exp,
              steps: [
                `Utilitzem t = distància / velocitat = (${formatSciUnicode(dist)}) ÷ (3 × 10⁸).`,
                `Dividim les mantisses i restem els exponents dels 10.`,
                `El senyal triga ${formatSciUnicode(t)} segons (és a dir, ${formatExactAsDecimal(t)} s).`,
              ],
              hint: 'Temps = Distància ÷ Velocitat. Recorda restar els exponents en dividir.',
            };
          },
          // 2.2 Biologia: Massa total de cèl·lules / glòbuls vermells
          () => {
            const count = makeExact(pick([2, 4, 5]), 13); // 2e13..5e13
            const singleMass = makeExact(pick([25, 30, 35, 40]), -15); // 2.5e-14 kg
            const totalMass = mulExact(count, singleMass);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Medicina',
              level,
              title: 'Massa cel·lular al cos humà',
              story: `El cos d’una persona adulta conté aproximadament ${formatSciUnicode(count)} glòbuls vermells. Si cada glòbul té una massa mitjana de ${formatSciUnicode(singleMass)} kg:`,
              question: 'Quina és la massa conjunta de tots els glòbuls vermells en kg? (en notació científica)',
              answerMode: 'sci',
              unit: 'kg',
              expectedValue: totalMass,
              expectedExp: normalizeExact(totalMass).exp,
              steps: [
                `Multipliquem el nombre de cèl·lules per la massa unitària: (${formatSciUnicode(count)}) × (${formatSciUnicode(singleMass)}).`,
                `Sumem els exponents: 13 + (${normalizeExact(singleMass).exp}) = ${13 + normalizeExact(singleMass).exp}.`,
                `Normalitzant el resultat: ${formatSciUnicode(totalMass)} kg.`,
              ],
              hint: 'Multiplica les dues magnituds i suma els exponents (compte amb el signe negatiu!).',
            };
          },
          // 2.3 Astronomia: Suma de dues distàncies o masses amb exponents propers
          () => {
            const distA = makeExact(randInt(14, 28), 10); // e.g. 1.4e11
            const distB = makeExact(randInt(35, 85), 9);  // e.g. 3.5e10
            const total = addExact(distA, distB);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Astronomia',
              level,
              title: 'Trajecte d’una missió interplanetària',
              story: `Una nau espacial recorre una primera etapa de ${formatSciUnicode(distA)} metres i una segona etapa d’exploració de ${formatSciUnicode(distB)} metres.`,
              question: 'Quina distància total ha recorregut la nau en metres? (en notació científica)',
              answerMode: 'sci',
              unit: 'm',
              expectedValue: total,
              expectedExp: normalizeExact(total).exp,
              steps: [
                `Com que és una suma, hem d’igualar els exponents a 10¹¹.`,
                `${formatSciUnicode(distB)} = ${formatMantissaAtExponent(distB, 11)} × 10¹¹.`,
                `Sumem les mantisses i obtenim ${formatSciUnicode(total)} m.`,
              ],
              hint: 'És una suma! Iguala primer les potències de 10 abans de sumar les mantisses.',
            };
          },
          // 2.4 Energia: Consum d'una ciutat
          () => {
            const homes = makeExact(pick([2, 3, 4, 5]), 5); // 2e5..5e5
            const kwhPerHome = makeExact(pick([32, 35, 45, 48]), 2); // 3.2e3..4.8e3
            const total = mulExact(homes, kwhPerHome);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Energia',
              level,
              title: 'Consum elèctric anual',
              story: `Una àrea metropolitana té ${formatSciUnicode(homes)} llars. Si cada llar consumeix una mitjana de ${formatSciUnicode(kwhPerHome)} kWh d’electricitat a l’any:`,
              question: 'Quin és el consum elèctric anual total en kWh? (en notació científica)',
              answerMode: 'sci',
              unit: 'kWh',
              expectedValue: total,
              expectedExp: normalizeExact(total).exp,
              steps: [
                `Multipliquem: (${formatSciUnicode(homes)}) × (${formatSciUnicode(kwhPerHome)}).`,
                `Operem mantisses i sumem exponents (5 + 3 = 8).`,
                `Normalitzant si cal, obtenim ${formatSciUnicode(total)} kWh.`,
              ],
              hint: 'Multiplica el nombre de llars pel consum mitjà de cada llar.',
            };
          },
        ]
      : [
          // 3.1 Conversió d'unitats + quocient (quantes vegades és més gran)
          () => {
            const cellUm = pick([15, 24, 30, 45]); // micròmetres = 10^-6 m
            const virusNm = pick([30, 40, 50, 60]); // nanòmetres = 10^-9 m
            // ratio = (cellUm * 10^-6) / (virusNm * 10^-9) = (cellUm / virusNm) * 10^3
            // Choose clean pairs
            const pairs: Array<[number, number]> = [
              [12, 40],
              [15, 30],
              [18, 45],
              [24, 60],
              [36, 45],
            ];
            const [cUm, vNm] = pick(pairs);
            const cellM = makeExact(cUm, -6);
            const virusM = makeExact(vNm, -9);
            const ratio = divExact(cellM, virusM);
            const normCell = normalizeExact(cellM);
            const normVirus = normalizeExact(virusM);
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Nanotecnologia',
              level,
              title: 'Escales microscòpiques: cèl·lula vs. virus',
              story: `Una cèl·lula epitelial té un diàmetre de ${cUm} μm (${cUm} × 10⁻⁶ m) i un virus mesura ${vNm} nm (${vNm} × 10⁻⁹ m).`,
              question: 'Quantes vegades és més gran el diàmetre de la cèl·lula que el del virus? (en notació científica)',
              answerMode: 'sci',
              unit: 'vegades',
              expectedValue: ratio,
              expectedExp: normalizeExact(ratio).exp,
              steps: [
                `Normalitzem totes dues mesures en metres: ${formatSciUnicode(cellM)} m i ${formatSciUnicode(virusM)} m.`,
                `Dividim (${formatSciUnicode(cellM)}) ÷ (${formatSciUnicode(virusM)}).`,
                `En restar els exponents (${normCell.exp} - (${normVirus.exp}) = ${normCell.exp - normVirus.exp}) i normalitzar: ${formatSciUnicode(ratio)} vegades.`,
              ],
              hint: 'Divideix la mida de la cèl·lula entre la del virus en la mateixa unitat (metres). Atenció a la resta d’exponents negatius!',
            };
          },
          // 3.2 Química: Nombre de molècules en massa donada
          () => {
            const moles = pick([2, 3, 4, 5, 6]);
            const avogadro = makeExact(602, 21); // 6.02e23
            const total = mulExact(makeExact(moles, 2), avogadro);
            const rawProduct = formatExactAsDecimal(
              mulExact(makeExact(moles, 0), makeExact(602, -2)),
              false
            );
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Química',
              level,
              title: 'Constant d’Avogadro al laboratori',
              story: `Un mol de qualsevol substància conté 6,02 × 10²³ molècules. En un experiment disposem d’una mostra amb ${moles}00 mols d’aigua purificada.`,
              question: 'Quantes molècules d’aigua hi ha a la mostra? Expressa-ho en notació científica.',
              answerMode: 'sci',
              unit: 'molècules',
              expectedValue: total,
              expectedExp: normalizeExact(total).exp,
              steps: [
                `Expressem ${moles}00 mols com ${moles} × 10² mols.`,
                `Multipliquem (${moles} × 10²) × (6,02 × 10²³) = ${rawProduct} × 10²⁵.`,
                `Normalitzem la mantissa perquè sigui menor que 10: ${formatSciUnicode(total)} molècules.`,
              ],
              hint: `Escriu ${moles}00 en notació científica i multiplica-ho per 6,02 × 10²³.`,
            };
          },
          // 3.3 Astronomia: Distància en km a partir de velocitat de llum i minuts
          () => {
            // 1 min = 60 s. Pick minutes = 5, 10, 15, 20, 40
            const mins = pick([5, 10, 15, 20, 40]);
            const secs = mins * 60; // in s
            // c = 3 × 10^5 km/s
            const cKm = makeExact(3, 5);
            const distKm = mulExact(cKm, makeExact(secs, 0));
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Astronomia',
              level,
              title: 'Llum del Sol cap a un planeta',
              story: `La llum viatja a 3 × 10⁵ km/s. Si la llum del Sol triga ${mins} minuts a arribar a un asteroide:`,
              question: 'A quina distància en quilòmetres es troba l’asteroide del Sol? (en notació científica)',
              answerMode: 'sci',
              unit: 'km',
              expectedValue: distKm,
              expectedExp: normalizeExact(distKm).exp,
              steps: [
                `Passem el temps a segons: ${mins} min × 60 s/min = ${secs} s = ${formatSciUnicode(makeExact(secs, 0))} s.`,
                `Multipliquem velocitat per temps: (3 × 10⁵ km/s) × (${formatSciUnicode(makeExact(secs, 0))} s).`,
                `Resultat normalitzat: ${formatSciUnicode(distKm)} km.`,
              ],
              hint: 'Primer converteix els minuts a segons per fer coherent la unitat de la velocitat (km/s)!',
            };
          },
          // 3.4 Diferència entre dues masses atòmiques / planetàries amb conversió
          () => {
            const massA = makeExact(pick([64, 72, 85]), 23); // e.g. 6.4e24 kg (Earth-like)
            const massB = makeExact(pick([33, 48, 62]), 22); // e.g. 6.2e23 kg (Mars-like)
            const diff = subExact(massA, massB);
            const targetExp = normalizeExact(massA).exp;
            return {
              id: nextId('ctx'),
              category: 'context',
              domainLabel: 'Ciències planetàries',
              level,
              title: 'Comparació de masses planetàries',
              story: `Un exoplaneta rocós té una massa de ${formatSciUnicode(massA)} kg i el planeta veí té una massa de ${formatSciUnicode(massB)} kg.`,
              question: 'Quina és la diferència de massa entre tots dos planetes en kg? (en notació científica)',
              answerMode: 'sci',
              unit: 'kg',
              expectedValue: diff,
              expectedExp: normalizeExact(diff).exp,
              steps: [
                `Igualem els exponents a 10${toSuperscript(targetExp)}: ${formatSciUnicode(massB)} = ${formatMantissaAtExponent(massB, targetExp)} × 10${toSuperscript(targetExp)}.`,
                `Restem les mantisses: ${formatMantissaAtExponent(massA, targetExp)} - ${formatMantissaAtExponent(massB, targetExp)} = ${formatMantissaAtExponent(diff, targetExp)}.`,
                `Resultat normalitzat: ${formatSciUnicode(diff)} kg.`,
              ],
              hint: 'Per trobar la diferència cal restar les dues masses igualant primer els exponents de 10.',
            };
          },
        ];

  return pick(builders)();
}

// ============================================================================
// MASTER DISPATCHER
// ============================================================================
export function generateExercise(filter: PracticeFilter, level: Level): Exercise {
  let category: ExerciseCategory;
  if (filter === 'mixed') {
    const categories: ExerciseCategory[] = [
      'compare',
      'find_exponent',
      'add_sub',
      'mul_div',
      'context',
    ];
    category = pick(categories);
  } else {
    category = filter;
  }

  switch (category) {
    case 'compare':
      return generateCompareExercise(level);
    case 'find_exponent':
      return generateFindExponentExercise(level);
    case 'add_sub':
      return generateAddSubExercise(level);
    case 'mul_div':
      return generateMulDivExercise(level);
    case 'context':
      return generateContextExercise(level);
  }
}

export const CATEGORY_LABELS: Record<PracticeFilter, string> = {
  mixed: 'Sessió mixta',
  compare: 'Comparació',
  find_exponent: 'Trobar exponent',
  add_sub: 'Suma i resta',
  mul_div: 'Multiplicació i divisió',
  context: 'Problemes de context',
};

export const LEVEL_LABELS: Record<Level, { short: string; title: string; desc: string }> = {
  1: {
    short: 'Nivell 1',
    title: 'Bàsic',
    desc: 'Exponents petits, mateix exponent en sumes i conversions directes.',
  },
  2: {
    short: 'Nivell 2',
    title: 'Intermedi',
    desc: 'Exponents negatius, ajust de mantisses i exponents diferents.',
  },
  3: {
    short: 'Nivell 3',
    title: 'Avançat',
    desc: 'Re-normalització exigent, conversions d’unitats i casos trampa.',
  },
};
