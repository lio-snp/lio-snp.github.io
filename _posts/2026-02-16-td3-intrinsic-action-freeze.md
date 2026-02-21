---
title: "TD3 Intrinsic Reward vs Action Freeze: A Bilingual Toy-Model Note"
date: 2026-02-16
permalink: /posts/2026/02/td3-intrinsic-action-freeze/
tags:
  - reinforcement learning
  - td3
  - intrinsic reward
  - trading
  - interpretability
categories:
  - research
excerpt: "Why intrinsic reward can move value estimates but leave policy actions unchanged: action-gap thresholds, tanh gating, and scale imbalance in a toy-model audit."
---

<style>
.td3-bilingual-switch {
  display: flex;
  gap: 0.6rem;
  margin: 0.75rem 0 1.25rem;
}

.td3-bilingual-switch button {
  border: 1px solid #c7cedb;
  border-radius: 999px;
  background: #f7f9fc;
  color: #1f2a44;
  padding: 0.35rem 0.95rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.td3-bilingual-switch button.is-active {
  background: #1f2a44;
  color: #ffffff;
  border-color: #1f2a44;
}

.td3-figure-caption {
  font-size: 0.92rem;
  color: #4f5d75;
  margin-top: -0.3rem;
}
</style>

<div data-bilingual-post>
  <div class="td3-bilingual-switch" role="tablist" aria-label="Language switch">
    <button type="button" data-lang-btn="zh" class="is-active" role="tab" aria-selected="true">中文</button>
    <button type="button" data-lang-btn="en" role="tab" aria-selected="false">English</button>
  </div>

  <section data-lang-panel="zh" markdown="1">

## 核心问题

在交易类强化学习实验中，经常出现一个看似矛盾的现象：
`intrinsic_mean_delta_mean` 明显非零，但策略动作几乎不动，甚至长期贴边（`action_equal_ratio_mean = 1`）。

这篇笔记给出一个可解释的三段机制链：

1. 内生奖励可以抬高 Critic 的 value level，但不一定改变动作 ranking。  
2. TD3 actor 的 `tanh` 输出在贴边时会形成门控衰减，导致有效梯度坍缩。  
3. 状态量纲失衡会放大 pre-activation 方差，进一步提升饱和概率，削弱内生信号传导。  

## 1) Action-Gap 阈值：为什么 value 变了但策略不变

令总奖励为

$$
r_t^{tot} = r_t^{env} + w \, r_t^{int}.
$$

如果内生项主要贡献的是动作无关偏置，那么它更多是在“抬水位”，而不是改排序。
真正决定动作翻转的，是动作相关项能否跨过环境 action gap：

$$
w \cdot \sup_{a_1,a_2} \left|\Delta^\mu(s,a_1)-\Delta^\mu(s,a_2)\right| < m(s)
\Rightarrow
\arg\max_a Q_{tot}^\mu(s,a)=\arg\max_a Q_{env}^\mu(s,a).
$$

![Action-gap phase boundary](/images/blog/td3-intrinsic-toy/fig_action_gap_phase.png)
<p class="td3-figure-caption">图 1：Action-gap 相变图。红区表示 ranking flip，蓝线为理论阈值边界。</p>

在 toy 仿真中：

- $\sup\Delta = 2.0$  
- 当 $m=0.2$ 时，理论阈值 $\lambda^\star = 0.1$  
- 经验边界同样约为 $0.1$  

## 2) Tanh 门控：Actor 梯度为什么在边界附近“失声”

TD3 actor 通常写为：

$$
a = a_{max}\tanh(u), \quad u=f_\theta(x).
$$

其导数为：

$$
\frac{\partial a}{\partial u}
= a_{max}\left(1-\tanh^2(u)\right)
= a_{max}\left(1-\left(\frac{a}{a_{max}}\right)^2\right).
$$

定义门控因子

$$
\kappa(s)=1-\left(\frac{a}{a_{max}}\right)^2 \in [0,1].
$$

当 $|a|\to a_{max}$ 时，$\kappa \to 0$，有效策略梯度被显著压扁。
如果写成 $|a|/a_{max}=1-\delta$（$\delta\ll1$），那么

$$
\kappa \approx 2\delta,
$$

即边界附近有效梯度是一阶小量。

## 3) 量纲失衡：为什么会更容易饱和

当输入中大尺度特征方差远高于小尺度特征时，
pre-activation 更容易落入 `tanh` 饱和区，形成链式效应：

$$
\text{scale imbalance}
\to \mathrm{Var}(u)\uparrow
\to \mathbb{P}(|a|\approx a_{max})\uparrow
\to \mathbb{E}[\kappa]\downarrow
\to \text{intrinsic gradient transport}\downarrow.
$$

`state_norm` 的直观作用，就是将工作点拉回到高灵敏区。

![Gate and scale effects](/images/blog/td3-intrinsic-toy/fig_gate_and_scale.png)
<p class="td3-figure-caption">图 2：B1 显示 tanh 门控衰减；B2/B3 显示尺度比升高下饱和率上升与小信号传输崩塌，以及 norm 的恢复效果。</p>

toy 指标摘要：

- 无 norm 时，尺度比从 $1 \to 100$，$\mathbb{E}[\kappa]$ 约从 `0.481` 降到 `0.007`。  
- 小信号传输 $\mathbb{E}[|\kappa x_{small}|]$ 约从 `0.304` 降到 `0.0059`。  
- 加 norm 后，上述量级基本维持在 `0.48` 与 `0.304` 附近。  

## 4) 实务审计闭环

建议在真实实验中固定两份检查：

1. `state_scale_summary.json`  
检查 `pre_stats/post_stats` 的 `p95_abs`、`p99_abs` 是否跨维收敛。  
2. `td3_action_saturation.json`  
联合 `near-bound`、`action_equal_ratio`、`eval_value_mae` 判断是否真正打破 Actor 冻结。  

如果 `near-bound` 已下降但 `action_equal_ratio` 仍接近 1，优先改 intrinsic 的动作相关结构，而不是继续堆 norm 超参数。

## 复现实验

```bash
python3 toy_td3_intrinsic_experiments.py
```

输出包括：

- `figures/fig_action_gap_phase.png`  
- `figures/fig_gate_and_scale.png`  
- `toy_metrics.json`

  </section>

  <section data-lang-panel="en" markdown="1" style="display:none;">

## The Core Puzzle

In trading-oriented RL experiments, a recurring pattern appears:
`intrinsic_mean_delta_mean` is clearly non-zero, yet policy behavior barely changes, often remaining boundary-clamped (`action_equal_ratio_mean = 1`).

This note explains the phenomenon through a three-step mechanism:

1. Intrinsic reward can raise Critic value levels without changing action ranking.  
2. TD3 actor's `tanh` output introduces gating decay near boundaries, collapsing effective gradients.  
3. Feature scale imbalance inflates pre-activation variance, increases saturation probability, and further weakens intrinsic signal transmission.  

## 1) Action-Gap Threshold: Why Value Moves but Policy Does Not

Let the total reward be

$$
r_t^{tot} = r_t^{env} + w \, r_t^{int}.
$$

If intrinsic reward mostly contributes action-independent bias, it shifts value levels rather than action order.
Action change only happens when the action-dependent term crosses the environment action gap:

$$
w \cdot \sup_{a_1,a_2} \left|\Delta^\mu(s,a_1)-\Delta^\mu(s,a_2)\right| < m(s)
\Rightarrow
\arg\max_a Q_{tot}^\mu(s,a)=\arg\max_a Q_{env}^\mu(s,a).
$$

![Action-gap phase boundary](/images/blog/td3-intrinsic-toy/fig_action_gap_phase.png)
<p class="td3-figure-caption">Figure 1: Action-gap phase map. Red regions indicate ranking flips; the blue line is the theoretical threshold boundary.</p>

Toy results show:

- $\sup\Delta = 2.0$  
- At $m=0.2$, the theoretical threshold is $\lambda^\star = 0.1$  
- The empirical boundary is also about $0.1$  

## 2) Tanh Gating: Why Actor Gradients Go Silent Near the Boundary

TD3 actor is commonly written as

$$
a = a_{max}\tanh(u), \quad u=f_\theta(x).
$$

Its derivative is

$$
\frac{\partial a}{\partial u}
= a_{max}\left(1-\tanh^2(u)\right)
= a_{max}\left(1-\left(\frac{a}{a_{max}}\right)^2\right).
$$

Define the gating term

$$
\kappa(s)=1-\left(\frac{a}{a_{max}}\right)^2 \in [0,1].
$$

As $|a|\to a_{max}$, $\kappa \to 0$, and effective policy gradients are strongly suppressed.
With $|a|/a_{max}=1-\delta$ ($\delta\ll1$),

$$
\kappa \approx 2\delta,
$$

so near-boundary gradients become first-order small.

## 3) Scale Imbalance: Why Saturation Becomes More Likely

When high-scale features dominate low-scale ones in variance,
pre-activation values are pushed into the `tanh` saturation region more often, producing the chain:

$$
\text{scale imbalance}
\to \mathrm{Var}(u)\uparrow
\to \mathbb{P}(|a|\approx a_{max})\uparrow
\to \mathbb{E}[\kappa]\downarrow
\to \text{intrinsic gradient transport}\downarrow.
$$

`state_norm` acts as a practical preconditioner that pulls activations back to a sensitive region.

![Gate and scale effects](/images/blog/td3-intrinsic-toy/fig_gate_and_scale.png)
<p class="td3-figure-caption">Figure 2: B1 shows tanh gating decay; B2/B3 show rising saturation and collapsing small-signal transport under scale imbalance, plus recovery with normalization.</p>

Toy metric highlights:

- Without normalization, increasing scale ratio from $1 \to 100$ pushes $\mathbb{E}[\kappa]$ from about `0.481` to `0.007`.  
- Small-signal transport $\mathbb{E}[|\kappa x_{small}|]$ drops from about `0.304` to `0.0059`.  
- With normalization, these stay near `0.48` and `0.304`.  

## 4) Practical Audit Loop

In real experiments, keep two checks fixed:

1. `state_scale_summary.json`  
Track whether `p95_abs` and `p99_abs` in `pre_stats/post_stats` converge across dimensions.  
2. `td3_action_saturation.json`  
Combine `near-bound`, `action_equal_ratio`, and `eval_value_mae` to verify whether actor freeze is truly broken.  

If `near-bound` declines but `action_equal_ratio` stays near 1, prioritize redesigning the action-dependent intrinsic structure instead of adding more normalization tuning.

## Reproduction

```bash
python3 toy_td3_intrinsic_experiments.py
```

Expected outputs:

- `figures/fig_action_gap_phase.png`  
- `figures/fig_gate_and_scale.png`  
- `toy_metrics.json`

  </section>
</div>

<script>
(function () {
  function initBilingualPost() {
    var root = document.querySelector("[data-bilingual-post]");
    if (!root) return;

    var buttons = root.querySelectorAll("[data-lang-btn]");
    var panels = root.querySelectorAll("[data-lang-panel]");

    function setLang(lang) {
      for (var i = 0; i < panels.length; i += 1) {
        var panel = panels[i];
        panel.style.display = panel.getAttribute("data-lang-panel") === lang ? "" : "none";
      }

      for (var j = 0; j < buttons.length; j += 1) {
        var btn = buttons[j];
        var active = btn.getAttribute("data-lang-btn") === lang;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      }
    }

    for (var k = 0; k < buttons.length; k += 1) {
      buttons[k].addEventListener("click", function (event) {
        var target = event.currentTarget.getAttribute("data-lang-btn");
        setLang(target);
      });
    }

    setLang("zh");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBilingualPost);
  } else {
    initBilingualPost();
  }
})();
</script>
