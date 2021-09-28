/**
 * 题1: 从[0, 1]走到[a, b]有多少种走法,每次只能向下/向右走一步
 *
 * 分析问题:
 *  1.理解为x-y图,可以看出每次只有两种选择,符合递归规律
 *  2.★递归优化(重复子问题)
 *  3.★想到递归就要想能不能用动态规划, dp填表法( 找[x,y]和左边上边的关系 )
 *  4.★想到动态规划就要像能不能转换成纯数学问题(概率、组合),通过公式求解
 *
 * 既然是动态规划-找点和左边、上边的关系:
 *  1.x = 0, y = 0情况, f(x, y) =  1
 *  2.x > 0, y = 0情况, f(x, y) =  f(x-1, y)
 *  3.x = 0, y > 0情况, f(x, y) =  f(x, y-1)
 *  4.x > 0, y > 0情况, f(x, y) =  f(x-1, y) + f(x, y-1)
 * 可能有点抽象，解释一下，
 *  第2点, 在x轴上, 只能一直往右,那前一个点和后一个点的“走法种数”肯定相等
 *  第3点同上
 *  第4点, 如在[4, 3]的点, 左边[3, 3]和上边[4, 2]都能一步就到,所以可以转化为求左边和上边点的“走法种数”
 *
 * 拆分问题:
 * 递归:
 *  1.都是从[0, 0]开始,所以不需要该参数
 *  2.需要一个目标点, 参数 x、参数 y
 *
 * 动态规划:
 *  1.都是从[0, 0]开始, _
 *  2.需要一个表的宽高, 参数w、参数h
 *  3.需要一个表, 变量dp
 *  4.返回dp或dp[w][h]
 *
 */

// 递归
// function f(x, y) {
//     if (x === 0 && y === 0) {
//         return 1
//     }else if (x > 0 && y === 0) {
//         return f(x - 1, y)
//     }else if (x === 0 && y > 0) {
//         return f(x, y - 1)
//     }else if (x > 0 && y > 0) {
//         return f(x - 1, y) + f(x, y - 1)
//     }
// }
// console.log(f(4, 3))    // OUTPUT: 35


// 递归优化-去除重复子问题-通过缓存起来
// function f(x, y, dp = []) {
//     if (!dp[y]) {
//         dp[y] = []
//     }
//     if (dp[y][x]) {
//         return dp[y][x]
//     }
//     if (x === 0 && y === 0) {
//         dp[y][x] = 1
//     }else if (x > 0 && y === 0) {
//         dp[y][x] =  f(x - 1, y)
//     }else if (x === 0 && y > 0) {
//         dp[y][x] =  f(x, y - 1)
//     }else if (x > 0 && y > 0) {
//         dp[y][x] =  f(x - 1, y) + f(x, y - 1)
//     }
//     return dp[y][x]
// }
// console.log(f(4, 3))    // OUTPUT: 35


// 动态规划
function f(w, h) {
    let dp = []
    for (let y = 0; y <= h; y++) {
        dp[y] = []
        for (let x = 0; x <= w; x++) {
            if (x === 0 && y === 0) {
                dp[y][x] = 1
            } else if (x > 0 && y === 0) {
                dp[y][x] = dp[y][x - 1]
            } else if (x === 0 && y > 0) {
                dp[y][x] = dp[y - 1][x]
            } else if (x > 0 && y > 0) {
                dp[y][x] = dp[y][x - 1] + dp[y - 1][x]
            }
        }
    }
    return dp[h][w]
}
console.log(f(4, 3))    // OUTPUT: 35