import minimist from "minimist";

const args = minimist(process.argv.slice(2));

console.log(args);

class INJ {
    constructor() {
        // 构造函数内容
    }

    /**
     * Process the source code containing INJ code
     * @param {string} source - source code with INJ code in it.
     * @returns {string} mcfunction code
     */
    process(source: string): string {
        return ''; // 临时返回空字符串，等待实现
    }
}