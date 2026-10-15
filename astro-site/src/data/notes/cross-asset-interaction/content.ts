import katex from 'katex';
import facts from './figure-data.json';
const raw = String.raw;
const m = (source: string, displayMode = false) => katex.renderToString(source, { displayMode, throwOnError: true, output: 'htmlAndMathml' });
const equation = (source: string) => `<div class="equation" tabindex="0" aria-label="Mathematical equation">${m(source, true)}</div>`;
const pair = (date: string, key: 'JPM/BAC' | 'BAC/MSFT') => facts.selected_pairs[date as keyof typeof facts.selected_pairs][key].toFixed(2);
const references = `<ul class="references"><li><a href="https://www.fdic.gov/news/press-releases/2023/pr23016.html">FDIC · Silicon Valley Bank closure, March 10, 2023</a></li><li><a href="https://www.msci.com/data-and-analytics/factor-investing/equity-factor-models">MSCI · Barra equity factor models</a></li><li><a href="https://github.com/GxLenesky/Cointigration_PairsTrading/tree/d33cae61a27059c922ee860bc0679989295b605c/SelectedPairs">Daily closes · Bank, energy and retail pairs</a></li><li><a href="https://github.com/Damilolawonder/stock_market_analysis">Daily closes · Technology stocks</a></li></ul>`;
export const editions = {
  en: {
    title: 'Cross-Asset Interaction and Covariance Geometry',
    description: 'Weighted feature geometry, an SVB event window, and common return directions.',
    kind: 'Concept note',
    tldr: `<p>I’ve been reading Kelly et al.’s <em>Artificial Intelligence Asset Pricing Models</em>. The cross-asset interaction structure ${m(raw`X_tWX_t^\top`)} in the Linear Portfolio Transformer reminded me of a similar matrix form in a report on the Barra risk model that I read during an internship, though I couldn’t recall exactly how they differed. So I put together a small example using stock returns around the 2023 SVB crisis, looking at how the interaction matrix changes, then using the example to understand how Barra estimates covariance and why eigenvectors can describe common directions of variation.</p>`,
    sections: [
      { id: 'interactions', title: '1. From features to interactions', html: `
        <p>For ${m('N')} stocks with ${m('P')} features each, let ${m(raw`X_t\in\mathbb{R}^{N\times P}`)} contain one stock per row. A bilinear interaction matrix is</p>
        ${equation(raw`S_t=X_tWX_t^\top,\qquad (S_t)_{ij}=x_{i,t}^\top W x_{j,t}.`)}
        <p>Each entry is a weighted interaction between two feature vectors. Features may describe returns, volatility, or firm characteristics, depending on the question. They need not be correlated with one another; each coordinate must have the same definition and a comparable scale across stocks.</p>
        <p>For a positive semidefinite ${m('W')}, the score has an inner-product interpretation:</p>
        ${equation(raw`x_i^\top W x_j=(W^{1/2}x_i)^\top(W^{1/2}x_j).`)}
        <p>For example, ${m(raw`x_i=(1,1)^\top`)} and ${m(raw`x_j=(1,-1)^\top`)} are orthogonal. With ${m(raw`W=\operatorname{diag}(4,1)`)}, their transformed vectors are ${m(raw`(2,1)^\top`)} and ${m(raw`(2,-1)^\top`)}: the weighted score is ${m('3')}, although the original vectors have not changed.</p>
        <!-- FIGURE:weighted -->
        <p>The interpretation depends on ${m('W')}. A symmetric ${m('W')} gives a symmetric ${m('S_t')}; a positive semidefinite ${m('W')} also makes ${m('S_t')} positive semidefinite. These properties alone do not make its entries correlations or identify risk transmission.</p>` },
      { id: 'svb', title: '2. An event window around SVB', html: `
        <p>Silicon Valley Bank was closed and the FDIC appointed receiver on <a href="https://www.fdic.gov/news/press-releases/2023/pr23016.html">March 10, 2023</a>. Figure 2 compares five observation dates around that event for ten stocks: two banks, two energy stocks, two retailers, and four technology stocks. SVB itself is the event marker, rather than a constituent.</p>
        <p>Here, features are the last five daily returns of each stock, standardized against that stock’s fixed February 8–March 7, 2023 baseline:</p>
        ${equation(raw`r_{i,d}=\frac{p_{i,d}}{p_{i,d-1}}-1,\quad z_{i,d}=\frac{r_{i,d}-\mu_{i,\mathrm{ref}}}{\sigma_{i,\mathrm{ref}}},`)}
        ${equation(raw`x_{i,t}=(z_{i,t-4},\ldots,z_{i,t})^\top,\qquad S_t=\frac{1}{5}X_tX_t^\top.`)}
        <p>Prices are the unadjusted daily closes supplied with this note. The index advances over trading days. The reference statistics use ${facts.reference_observations} observed returns from ${facts.reference_start} to ${facts.reference_end}; ${m(raw`\sigma_{i,\mathrm{ref}}`)} is the sample standard deviation. The same baseline and color scale apply to every panel.</p>
        <!-- FIGURE:timeline -->
        <p>Each entry averages five products of standardized returns. A positive score means same-sign products outweigh opposite-sign products; a negative score means the reverse. A large move can dominate the sum, and simultaneous losses can produce a red cell.</p>
        <p>In this calculation, the JPM–BAC score changes from ${pair('2023-03-07','JPM/BAC')} on March 7 to ${pair('2023-03-13','JPM/BAC')} on March 13. The BAC–MSFT score changes from ${pair('2023-03-07','BAC/MSFT')} to ${pair('2023-03-17','BAC/MSFT')} between March 7 and March 17. A shared large loss can increase the score without establishing a stronger structural link. These are descriptive changes in a short-window interaction score. The windows are not re-centered or normalized to unit length, so this is neither a rolling correlation matrix nor a covariance estimate.</p>` },
      { id: 'risk-model', title: '3. Similar algebra, different quantities', html: `
        <p>A factor risk model uses a similar matrix product, but the terms have statistical meanings. Write ${m(raw`B_t\in\mathbb{R}^{N\times K}`)} for exposures to ${m('K')} risk factors, using a separate symbol to distinguish these exposures from arbitrary input features:</p>
        ${equation(raw`r_{t+1}=B_tf_{t+1}+\varepsilon_{t+1},\qquad \Sigma_t=B_tF_tB_t^\top+D_t.`)}
        <p>Conditional on information at ${m('t')}, ${m('F_t')} is the covariance of factor returns and ${m('D_t')} is the covariance of specific returns. The decomposition assumes zero covariance between factor and specific returns; a diagonal ${m('D_t')} additionally assumes no cross-asset specific covariance. Barra-style models use factor structure to estimate risk across many assets.</p>
        <p>The factor component ${m(raw`B_tf_{t+1}`)} lies in the column space of ${m('B_t')}; ${m(raw`\varepsilon_{t+1}`)} accounts for the remainder. This decomposition does not require each realized residual to be perpendicular to that space.</p>
        <!-- FIGURE:subspace -->
        <p>Unlike a freely chosen interaction weight ${m('W')}, ${m('F_t')} carries factor-return variance and covariance. The units of ${m(raw`\Sigma_t`)} are squared returns. The heatmaps above are dimensionless scores with a different construction.</p>` },
      { id: 'geometry', title: '4. Common directions of variation', html: `
        <p>For centered returns ${m(raw`\delta r=r-\mathbb{E}[r]`)}, a symmetric covariance matrix has orthonormal eigenvectors:</p>
        ${equation(raw`\Sigma v_k=\lambda_kv_k,\quad \|v_k\|=1,\qquad \operatorname{Var}(v_k^\top\delta r)=\lambda_k.`)}
        <p>The direction ${m('v_k')} specifies a linear combination of asset returns. Its eigenvalue is the variance along that direction. In a two-asset illustration, measured in percentage points,</p>
        ${equation(raw`\Sigma=\begin{bmatrix}4&3\\3&4\end{bmatrix},\qquad v_1=\frac{1}{\sqrt2}\begin{bmatrix}1\\1\end{bmatrix},\ \lambda_1=7,\qquad v_2=\frac{1}{\sqrt2}\begin{bmatrix}1\\-1\end{bmatrix},\ \lambda_2=1.`)}

        <p>The covariance ellipse’s long axis follows ${m('v_1')}: JPM and BAC move together relative to their means. The short axis follows ${m('v_2')}: one moves relative to the other. The ellipse ${m(raw`\delta r^\top\Sigma^{-1}\delta r=1`)} has semi-axis lengths ${m(raw`\sqrt7`)} and ${m('1')}. It represents the covariance geometry of this illustrative matrix, not a distribution fitted to the SVB data.</p>
        <p>These are orthogonal directions in return space, not separate market regimes or forecasts of price direction. Their projections are uncorrelated; independence would require additional distributional assumptions. Around an event, changes in ${m(raw`\Sigma_t`)}, its eigenvalues, and its eigendirections describe changes in covariance structure, variance along principal directions, and orientation. Eigenvector signs are arbitrary, and directions can be unstable when eigenvalues are close.</p>` }
    ],
    sourcesTitle: 'Sources', sources: references
  },
  zh: {
    title: '跨资产交互与协方差的几何结构',
    description: '从特征交互矩阵、SVB 事件窗口到共同波动方向。',
    kind: '概念笔记',
    tldr: `<p>最近在读 Kelly et al. 的 <em>Artificial Intelligence Asset Pricing Models</em>，其中 Linear Portfolio Transformer 的跨资产交互结构 ${m(raw`X_tWX_t^\top`)}，想起之前实习时读过的 Barra 风险模型研报好像有类似的矩阵形式，但忘记有什么具体区别。于是用 2023 年 SVB 危机前后的股票收益率做了一个小例子，观察交互矩阵如何变化，再顺着这个例子理解 Barra 如何估计协方差，以及特征向量为什么能描述共同波动的方向。</p>`,
    sections: [
      { id: 'interactions', title: '1. 从特征到交互', html: `
        <p>对于 ${m('N')} 只股票、每只股票 ${m('P')} 个特征的资产池，令 ${m(raw`X_t\in\mathbb{R}^{N\times P}`)} 的每一行对应一只股票。双线性交互矩阵可写为</p>
        ${equation(raw`S_t=X_tWX_t^\top,\qquad (S_t)_{ij}=x_{i,t}^\top W x_{j,t}.`)}
        <p>每个元素是两个特征向量的加权交互。特征可以是收益率、波动率或公司特征，取决于观测问题。不同特征之间不要求相关；同一坐标在不同股票间应有一致的定义，尺度也应可比。</p>
        <p>当 ${m('W')} 半正定时，得分可以解释为变换后特征向量的内积：</p>
        ${equation(raw`x_i^\top W x_j=(W^{1/2}x_i)^\top(W^{1/2}x_j).`)}
        <p>例如，${m(raw`x_i=(1,1)^\top`)} 与 ${m(raw`x_j=(1,-1)^\top`)} 原本正交。取 ${m(raw`W=\operatorname{diag}(4,1)`)} 后，变换后的向量为 ${m(raw`(2,1)^\top`)} 与 ${m(raw`(2,-1)^\top`)}。原始特征未变，加权得分却变为 ${m('3')}。</p>
        <!-- FIGURE:weighted -->
        <p>矩阵的含义还取决于 ${m('W')}。${m('W')} 对称时，${m('S_t')} 对称；${m('W')} 半正定时，${m('S_t')} 也半正定。但仅凭这些性质，不能把矩阵元素解释成相关系数或风险传导。</p>` },
      { id: 'svb', title: '2. SVB 事件窗口', html: `
        <p>SVB 于 <a href="https://www.fdic.gov/news/press-releases/2023/pr23016.html">2023 年 3 月 10 日被关闭，FDIC 被指定为接管人</a>。图 2 比较事件前后五个观测日期，包含两只银行股、两只能源股、两只零售股和四只科技股。SVB 是事件标记，不在这十只股票中。</p>
        <p>这里将每只股票最近五个交易日的收益率作为特征，用该股票在 2023 年 2 月 8 日至 3 月 7 日的固定基准进行标准化：</p>
        ${equation(raw`r_{i,d}=\frac{p_{i,d}}{p_{i,d-1}}-1,\quad z_{i,d}=\frac{r_{i,d}-\mu_{i,\mathrm{ref}}}{\sigma_{i,\mathrm{ref}}},`)}
        ${equation(raw`x_{i,t}=(z_{i,t-4},\ldots,z_{i,t})^\top,\qquad S_t=\frac{1}{5}X_tX_t^\top.`)}
        <p>价格采用本笔记所附数据中的未复权日收盘价。下标按交易日推进。基准统计量来自 ${facts.reference_start} 至 ${facts.reference_end} 的 ${facts.reference_observations} 个实际收益率观测，${m(raw`\sigma_{i,\mathrm{ref}}`)} 为样本标准差。所有面板使用相同的基准和色标。</p>
        <!-- FIGURE:timeline -->
        <p>每个元素是五个标准化收益率乘积的均值。正值表示同号乘积在总和中占优，负值则相反。较大的单次波动可能主导总和；两只股票同时下跌也可以形成红色区域。</p>
        <p>这次计算中，JPM–BAC 的得分从 3 月 7 日的 ${pair('2023-03-07','JPM/BAC')} 变为 3 月 13 日的 ${pair('2023-03-13','JPM/BAC')}。BAC–MSFT 的得分从 3 月 7 日的 ${pair('2023-03-07','BAC/MSFT')} 变为 3 月 17 日的 ${pair('2023-03-17','BAC/MSFT')}。共同的大幅下跌可以推高得分，但不能据此判断结构性联系增强。这些是短窗口交互得分的描述性变化。窗口内部没有重新去均值或归一化到单位长度，因此这既不是滚动相关矩阵，也不是协方差估计。</p>` },
      { id: 'risk-model', title: '3. 形式相似，统计含义不同', html: `
        <p>因子风险模型使用相似的矩阵乘积，但各项具有具体的统计含义。用 ${m(raw`B_t\in\mathbb{R}^{N\times K}`)} 表示 ${m('K')} 个风险因子的暴露，另用符号 ${m('B_t')} 区分因子暴露与任意输入特征：</p>
        ${equation(raw`r_{t+1}=B_tf_{t+1}+\varepsilon_{t+1},\qquad \Sigma_t=B_tF_tB_t^\top+D_t.`)}
        <p>给定 ${m('t')} 时刻的信息，${m('F_t')} 是因子收益率协方差，${m('D_t')} 是特异收益协方差。该分解假设因子收益与特异收益不相关；若 ${m('D_t')} 为对角矩阵，还假设不同资产的特异收益之间没有协方差。Barra 类模型通过因子结构估计高维资产池的风险。</p>
        <p>因子成分 ${m(raw`B_tf_{t+1}`)} 落在 ${m('B_t')} 的列空间中，${m(raw`\varepsilon_{t+1}`)} 则表示其余收益变化。该分解并不要求每一期实现的残差都与这个子空间垂直。</p>
        <!-- FIGURE:subspace -->
        <p>与任意指定的交互权重 ${m('W')} 不同，${m('F_t')} 表示因子收益率的方差和协方差。${m(raw`\Sigma_t`)} 的单位为收益率的平方；前面的热图是采用另一种构造方式得到的无量纲得分。</p>` },
      { id: 'geometry', title: '4. 共同波动的方向', html: `
        <p>对去均值收益率 ${m(raw`\delta r=r-\mathbb{E}[r]`)}，对称协方差矩阵具有一组标准正交特征向量：</p>
        ${equation(raw`\Sigma v_k=\lambda_kv_k,\quad \|v_k\|=1,\qquad \operatorname{Var}(v_k^\top\delta r)=\lambda_k.`)}
        <p>方向 ${m('v_k')} 指定一组资产收益率的线性组合，特征值是沿该方向的方差。以两只资产为例，用百分点表示收益率：</p>
        ${equation(raw`\Sigma=\begin{bmatrix}4&3\\3&4\end{bmatrix},\qquad v_1=\frac{1}{\sqrt2}\begin{bmatrix}1\\1\end{bmatrix},\ \lambda_1=7,\qquad v_2=\frac{1}{\sqrt2}\begin{bmatrix}1\\-1\end{bmatrix},\ \lambda_2=1.`)}

        <p>长轴沿 ${m('v_1')}：JPM 和 BAC 相对各自均值同向变化。短轴沿 ${m('v_2')}：两者做相对变化。椭圆 ${m(raw`\delta r^\top\Sigma^{-1}\delta r=1`)} 的半轴长度为 ${m(raw`\sqrt7`)} 与 ${m('1')}。它呈现的是这个示例矩阵的协方差几何结构，并非用 SVB 数据拟合的分布。</p>
        <p>这些是收益率空间中的正交方向，不是不同的历史市场状态，也不预测价格方向。沿这些方向的投影互不相关；独立性还需要额外的分布假设。事件前后，${m(raw`\Sigma_t`)}、特征值和特征方向的变化，分别描述协方差结构、主要方向上的方差和方向本身的变化。特征向量的正负号可以任意选取；特征值接近时，方向也可能不稳定。</p>` }
    ],
    sourcesTitle: '来源', sources: references
  }
};
