function tokenize(code) {
    return code
        .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")  // 去掉注释
        .replace(/\s+/g, " ")                      // 去掉多余空格
        .replace(/([{}();,])/g, " $1 ")            // 确保符号两侧有空格
        .trim()
        .split(/\s+/);                             // 按空格拆分成 Token
}

class TokenNormalizer {
    constructor() {
        this.varMap = new Map();
        this.funcMap = new Map();
        this.varCount = 0;
        this.funcCount = 0;
    }

    normalize(tokens) {
        return tokens.map(token => {
            // 保留基本的关键字、运算符等
            if (["int", "float", "double", "char", "void", "return", "+", "-", "*", "/"].includes(token)) {
                return token;  // 保留关键字和运算符
            }

            // 变量和函数名
            if (/^[a-zA-Z_]\w*$/.test(token)) {
                // 可能是函数
                if (tokens.includes("(") && tokens.includes(")")) {
                    if (!this.funcMap.has(token)) {
                        this.funcMap.set(token, `FUNC_${++this.funcCount}`);
                    }
                    return this.funcMap.get(token);
                } else {  // 变量
                    if (!this.varMap.has(token)) {
                        this.varMap.set(token, `VAR_${++this.varCount}`);
                    }
                    return this.varMap.get(token);
                }
            }

            return token;
        });
    }
}

class ASTNode {
    constructor(type, value) {
        this.type = type;
        this.value = value;
        this.children = [];
    }
}

function buildSyntaxTree(tokens) {
    let stack = [], root = new ASTNode("ROOT", null);
    let currentNode = root;

    tokens.forEach(token => {
        if (token === "{") {
            let newNode = new ASTNode("BLOCK", null);
            currentNode.children.push(newNode);
            stack.push(currentNode);
            currentNode = newNode;
        } else if (token === "}") {
            currentNode = stack.pop() || root;
        } else {
            currentNode.children.push(new ASTNode("TOKEN", token));
        }
    });

    return root;
}

function compareAST(node1, node2) {
    if (!node1 || !node2) return 0;
    if (node1.type !== node2.type) return 0;
    if (node1.value && node2.value && node1.value !== node2.value) return 0;

    const len1 = node1.children.length, len2 = node2.children.length;
    if (len1 === 0 && len2 === 0) return 1;

    const minLen = Math.min(len1, len2);
    let matchCount = 0;

    for (let i = 0; i < minLen; i++) {
        matchCount += compareAST(node1.children[i], node2.children[i]);
    }

    return matchCount / Math.max(len1, len2);
}

function jaccardSimilarity(set1, set2) {
    const intersection = set1.filter(x => set2.includes(x)).length;
    const union = new Set([...set1, ...set2]).size;
    return union === 0 ? 1 : Math.min(1, intersection / union);  // 确保相似度不会超过1
}

function editDistance(str1, str2) {
    const dp = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(0));
    for (let i = 0; i <= str1.length; i++) dp[i][0] = i;
    for (let j = 0; j <= str2.length; j++) dp[0][j] = j;

    for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (str1[i - 1] === str2[j - 1] ? 0 : 1)
            );
        }
    }
    return dp[str1.length][str2.length];
}

function simHash(tokens) {
    const hashbits = 64;
    let v = Array(hashbits).fill(0);

    tokens.forEach(token => {
        let hash = murmurhash3_32_gc(token);
        for (let i = 0; i < hashbits; i++) {
            let bitmask = 1 << i;
            v[i] += (hash & bitmask) ? 1 : -1;
        }
    });

    let fingerprint = 0n;
    for (let i = 0; i < hashbits; i++) {
        if (v[i] > 0) {
            fingerprint |= 1n << BigInt(i);
        }
    }
    return fingerprint;
}

function hammingDistance(hash1, hash2) {
    let x = hash1 ^ hash2;
    let tot = 0;
    while (x) {
        tot += 1;
        x &= x - 1n;
    }
    return tot;
}

function murmurhash3_32_gc(key, seed = 0) {
    let remainder = key.length & 3; // key.length % 4
    let bytes = key.length - remainder;
    let h1 = seed;
    let c1 = 0xcc9e2d51;
    let c2 = 0x1b873593;
    let i = 0;

    while (i < bytes) {
        let k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1 = (h1 * 5 + 0xe6546b64) & 0xffffffff;
    }

    let k1 = 0;
    switch (remainder) {
        case 3: k1 ^= key.charCodeAt(i + 2) << 16;
        case 2: k1 ^= key.charCodeAt(i + 1) << 8;
        case 1: k1 ^= key.charCodeAt(i);
            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;
    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = (((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}

/**
 * 代码相似度函数
 * @param {String} code1 代码片段1
 * @param {String} code2 代码片段2
 * @param {Object} weight 计算权重，默认为 { weightJaccard: 0.4, weightEdit: 0.2, weightAST: 0.5 }
 * 该对象包括以下属性：
 *   - weightJaccard {Number} Jaccard 相似度的权重（默认为 0.4）
 *   - weightEdit {Number} 编辑距离相似度的权重（默认为 0.1）
 *   - weightAST {Number} 语法树比对的权重（默认为 0.5）
 * @returns {Number} 代码相似度，返回值在 0 到 1 之间，值越接近 1 表示相似度越高
 * 
 * 该函数通过以下方法计算代码相似度：
 * 1. **Jaccard 相似度**：度量两个代码片段中 token 集合的相似度。
 * 2. **编辑距离**：计算两个代码片段之间最少的字符修改操作次数，衡量代码的结构相似度。
 * 3. **AST 比对**：通过构建抽象语法树（AST）来对比两段代码的语法结构，判断代码结构的相似性。
 * 
 * 最终相似度值是这三种方法相似度的加权平均值，可以根据需求调整权重。
 */
function calculateSimilarity(code1, code2, weight = { weightJaccard: 0.4, weightEdit: 0.1, weightAST: 0.3, weightSimHash: 0.2 }) {
    const normalizer = new TokenNormalizer();
    const tokens1 = normalizer.normalize(tokenize(code1));
    const tokens2 = normalizer.normalize(tokenize(code2));

    const relevantTokens1 = tokens1.filter(token => ![";", "{", "}"].includes(token));
    const relevantTokens2 = tokens2.filter(token => ![";", "{", "}"].includes(token));

    const jaccardSim = jaccardSimilarity(relevantTokens1, relevantTokens2);
    const editDist = editDistance(tokens1.join(" "), tokens2.join(" "));
    const maxLen = Math.max(tokens1.join(" ").length, tokens2.join(" ").length);
    const editSim = maxLen === 0 ? 1 : Math.max(0, 1 - editDist / maxLen);

    const tree1 = buildSyntaxTree(tokens1);
    const tree2 = buildSyntaxTree(tokens2);
    const astSim = compareAST(tree1, tree2) || 0;

    const hash1 = simHash(tokens1);
    const hash2 = simHash(tokens2);
    const simHashDist = hammingDistance(hash1, hash2);
    const simHashSim = Math.max(0, 1 - simHashDist / 64);

    const finalSimilarity = (
        jaccardSim * weight.weightJaccard +
        editSim * weight.weightEdit +
        astSim * weight.weightAST +
        simHashSim * weight.weightSimHash
    ).toFixed(2);

    return finalSimilarity;
}

export default calculateSimilarity