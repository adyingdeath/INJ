/**
 * 所有Action的基类
 */
export abstract class Action {
	/**
	 * 处理函数调用
	 * @param params 函数参数
	 * @param body 代码块内容，可能为空
	 */
	abstract execute(params: string, body?: string[]): string[];
}