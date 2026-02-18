import Lr, { isAxiosError as Er } from "axios";
var D = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Va(a) {
  return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, "default") ? a.default : a;
}
var z, kr;
function Ka() {
  if (kr) return z;
  kr = 1;
  function a() {
    this.__data__ = [], this.size = 0;
  }
  return z = a, z;
}
var V, Hr;
function L() {
  if (Hr) return V;
  Hr = 1;
  function a(e, r) {
    return e === r || e !== e && r !== r;
  }
  return V = a, V;
}
var K, Gr;
function E() {
  if (Gr) return K;
  Gr = 1;
  var a = L();
  function e(r, t) {
    for (var n = r.length; n--; )
      if (a(r[n][0], t))
        return n;
    return -1;
  }
  return K = e, K;
}
var X, Ur;
function Xa() {
  if (Ur) return X;
  Ur = 1;
  var a = E(), e = Array.prototype, r = e.splice;
  function t(n) {
    var i = this.__data__, s = a(i, n);
    if (s < 0)
      return !1;
    var o = i.length - 1;
    return s == o ? i.pop() : r.call(i, s, 1), --this.size, !0;
  }
  return X = t, X;
}
var J, Nr;
function Ja() {
  if (Nr) return J;
  Nr = 1;
  var a = E();
  function e(r) {
    var t = this.__data__, n = a(t, r);
    return n < 0 ? void 0 : t[n][1];
  }
  return J = e, J;
}
var W, Br;
function Wa() {
  if (Br) return W;
  Br = 1;
  var a = E();
  function e(r) {
    return a(this.__data__, r) > -1;
  }
  return W = e, W;
}
var Y, zr;
function Ya() {
  if (zr) return Y;
  zr = 1;
  var a = E();
  function e(r, t) {
    var n = this.__data__, i = a(n, r);
    return i < 0 ? (++this.size, n.push([r, t])) : n[i][1] = t, this;
  }
  return Y = e, Y;
}
var Z, Vr;
function k() {
  if (Vr) return Z;
  Vr = 1;
  var a = Ka(), e = Xa(), r = Ja(), t = Wa(), n = Ya();
  function i(s) {
    var o = -1, u = s == null ? 0 : s.length;
    for (this.clear(); ++o < u; ) {
      var c = s[o];
      this.set(c[0], c[1]);
    }
  }
  return i.prototype.clear = a, i.prototype.delete = e, i.prototype.get = r, i.prototype.has = t, i.prototype.set = n, Z = i, Z;
}
var Q, Kr;
function Za() {
  if (Kr) return Q;
  Kr = 1;
  var a = k();
  function e() {
    this.__data__ = new a(), this.size = 0;
  }
  return Q = e, Q;
}
var ee, Xr;
function Qa() {
  if (Xr) return ee;
  Xr = 1;
  function a(e) {
    var r = this.__data__, t = r.delete(e);
    return this.size = r.size, t;
  }
  return ee = a, ee;
}
var re, Jr;
function en() {
  if (Jr) return re;
  Jr = 1;
  function a(e) {
    return this.__data__.get(e);
  }
  return re = a, re;
}
var te, Wr;
function rn() {
  if (Wr) return te;
  Wr = 1;
  function a(e) {
    return this.__data__.has(e);
  }
  return te = a, te;
}
var ae, Yr;
function Ia() {
  if (Yr) return ae;
  Yr = 1;
  var a = typeof D == "object" && D && D.Object === Object && D;
  return ae = a, ae;
}
var ne, Zr;
function $() {
  if (Zr) return ne;
  Zr = 1;
  var a = Ia(), e = typeof self == "object" && self && self.Object === Object && self, r = a || e || Function("return this")();
  return ne = r, ne;
}
var ie, Qr;
function Sa() {
  if (Qr) return ie;
  Qr = 1;
  var a = $(), e = a.Symbol;
  return ie = e, ie;
}
var se, et;
function tn() {
  if (et) return se;
  et = 1;
  var a = Sa(), e = Object.prototype, r = e.hasOwnProperty, t = e.toString, n = a ? a.toStringTag : void 0;
  function i(s) {
    var o = r.call(s, n), u = s[n];
    try {
      s[n] = void 0;
      var c = !0;
    } catch {
    }
    var h = t.call(s);
    return c && (o ? s[n] = u : delete s[n]), h;
  }
  return se = i, se;
}
var oe, rt;
function an() {
  if (rt) return oe;
  rt = 1;
  var a = Object.prototype, e = a.toString;
  function r(t) {
    return e.call(t);
  }
  return oe = r, oe;
}
var ue, tt;
function H() {
  if (tt) return ue;
  tt = 1;
  var a = Sa(), e = tn(), r = an(), t = "[object Null]", n = "[object Undefined]", i = a ? a.toStringTag : void 0;
  function s(o) {
    return o == null ? o === void 0 ? n : t : i && i in Object(o) ? e(o) : r(o);
  }
  return ue = s, ue;
}
var ce, at;
function A() {
  if (at) return ce;
  at = 1;
  function a(e) {
    var r = typeof e;
    return e != null && (r == "object" || r == "function");
  }
  return ce = a, ce;
}
var he, nt;
function xr() {
  if (nt) return he;
  nt = 1;
  var a = H(), e = A(), r = "[object AsyncFunction]", t = "[object Function]", n = "[object GeneratorFunction]", i = "[object Proxy]";
  function s(o) {
    if (!e(o))
      return !1;
    var u = a(o);
    return u == t || u == n || u == r || u == i;
  }
  return he = s, he;
}
var fe, it;
function nn() {
  if (it) return fe;
  it = 1;
  var a = $(), e = a["__core-js_shared__"];
  return fe = e, fe;
}
var le, st;
function sn() {
  if (st) return le;
  st = 1;
  var a = nn(), e = (function() {
    var t = /[^.]+$/.exec(a && a.keys && a.keys.IE_PROTO || "");
    return t ? "Symbol(src)_1." + t : "";
  })();
  function r(t) {
    return !!e && e in t;
  }
  return le = r, le;
}
var de, ot;
function on() {
  if (ot) return de;
  ot = 1;
  var a = Function.prototype, e = a.toString;
  function r(t) {
    if (t != null) {
      try {
        return e.call(t);
      } catch {
      }
      try {
        return t + "";
      } catch {
      }
    }
    return "";
  }
  return de = r, de;
}
var pe, ut;
function un() {
  if (ut) return pe;
  ut = 1;
  var a = xr(), e = sn(), r = A(), t = on(), n = /[\\^$.*+?()[\]{}|]/g, i = /^\[object .+?Constructor\]$/, s = Function.prototype, o = Object.prototype, u = s.toString, c = o.hasOwnProperty, h = RegExp(
    "^" + u.call(c).replace(n, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  function l(d) {
    if (!r(d) || e(d))
      return !1;
    var _ = a(d) ? h : i;
    return _.test(t(d));
  }
  return pe = l, pe;
}
var ve, ct;
function cn() {
  if (ct) return ve;
  ct = 1;
  function a(e, r) {
    return e?.[r];
  }
  return ve = a, ve;
}
var ge, ht;
function Mr() {
  if (ht) return ge;
  ht = 1;
  var a = un(), e = cn();
  function r(t, n) {
    var i = e(t, n);
    return a(i) ? i : void 0;
  }
  return ge = r, ge;
}
var _e, ft;
function xa() {
  if (ft) return _e;
  ft = 1;
  var a = Mr(), e = $(), r = a(e, "Map");
  return _e = r, _e;
}
var ye, lt;
function G() {
  if (lt) return ye;
  lt = 1;
  var a = Mr(), e = a(Object, "create");
  return ye = e, ye;
}
var be, dt;
function hn() {
  if (dt) return be;
  dt = 1;
  var a = G();
  function e() {
    this.__data__ = a ? a(null) : {}, this.size = 0;
  }
  return be = e, be;
}
var qe, pt;
function fn() {
  if (pt) return qe;
  pt = 1;
  function a(e) {
    var r = this.has(e) && delete this.__data__[e];
    return this.size -= r ? 1 : 0, r;
  }
  return qe = a, qe;
}
var Te, vt;
function ln() {
  if (vt) return Te;
  vt = 1;
  var a = G(), e = "__lodash_hash_undefined__", r = Object.prototype, t = r.hasOwnProperty;
  function n(i) {
    var s = this.__data__;
    if (a) {
      var o = s[i];
      return o === e ? void 0 : o;
    }
    return t.call(s, i) ? s[i] : void 0;
  }
  return Te = n, Te;
}
var Re, gt;
function dn() {
  if (gt) return Re;
  gt = 1;
  var a = G(), e = Object.prototype, r = e.hasOwnProperty;
  function t(n) {
    var i = this.__data__;
    return a ? i[n] !== void 0 : r.call(i, n);
  }
  return Re = t, Re;
}
var Ce, _t;
function pn() {
  if (_t) return Ce;
  _t = 1;
  var a = G(), e = "__lodash_hash_undefined__";
  function r(t, n) {
    var i = this.__data__;
    return this.size += this.has(t) ? 0 : 1, i[t] = a && n === void 0 ? e : n, this;
  }
  return Ce = r, Ce;
}
var Oe, yt;
function vn() {
  if (yt) return Oe;
  yt = 1;
  var a = hn(), e = fn(), r = ln(), t = dn(), n = pn();
  function i(s) {
    var o = -1, u = s == null ? 0 : s.length;
    for (this.clear(); ++o < u; ) {
      var c = s[o];
      this.set(c[0], c[1]);
    }
  }
  return i.prototype.clear = a, i.prototype.delete = e, i.prototype.get = r, i.prototype.has = t, i.prototype.set = n, Oe = i, Oe;
}
var Ae, bt;
function gn() {
  if (bt) return Ae;
  bt = 1;
  var a = vn(), e = k(), r = xa();
  function t() {
    this.size = 0, this.__data__ = {
      hash: new a(),
      map: new (r || e)(),
      string: new a()
    };
  }
  return Ae = t, Ae;
}
var me, qt;
function _n() {
  if (qt) return me;
  qt = 1;
  function a(e) {
    var r = typeof e;
    return r == "string" || r == "number" || r == "symbol" || r == "boolean" ? e !== "__proto__" : e === null;
  }
  return me = a, me;
}
var $e, Tt;
function U() {
  if (Tt) return $e;
  Tt = 1;
  var a = _n();
  function e(r, t) {
    var n = r.__data__;
    return a(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
  }
  return $e = e, $e;
}
var we, Rt;
function yn() {
  if (Rt) return we;
  Rt = 1;
  var a = U();
  function e(r) {
    var t = a(this, r).delete(r);
    return this.size -= t ? 1 : 0, t;
  }
  return we = e, we;
}
var je, Ct;
function bn() {
  if (Ct) return je;
  Ct = 1;
  var a = U();
  function e(r) {
    return a(this, r).get(r);
  }
  return je = e, je;
}
var Ie, Ot;
function qn() {
  if (Ot) return Ie;
  Ot = 1;
  var a = U();
  function e(r) {
    return a(this, r).has(r);
  }
  return Ie = e, Ie;
}
var Se, At;
function Tn() {
  if (At) return Se;
  At = 1;
  var a = U();
  function e(r, t) {
    var n = a(this, r), i = n.size;
    return n.set(r, t), this.size += n.size == i ? 0 : 1, this;
  }
  return Se = e, Se;
}
var xe, mt;
function Rn() {
  if (mt) return xe;
  mt = 1;
  var a = gn(), e = yn(), r = bn(), t = qn(), n = Tn();
  function i(s) {
    var o = -1, u = s == null ? 0 : s.length;
    for (this.clear(); ++o < u; ) {
      var c = s[o];
      this.set(c[0], c[1]);
    }
  }
  return i.prototype.clear = a, i.prototype.delete = e, i.prototype.get = r, i.prototype.has = t, i.prototype.set = n, xe = i, xe;
}
var Me, $t;
function Cn() {
  if ($t) return Me;
  $t = 1;
  var a = k(), e = xa(), r = Rn(), t = 200;
  function n(i, s) {
    var o = this.__data__;
    if (o instanceof a) {
      var u = o.__data__;
      if (!e || u.length < t - 1)
        return u.push([i, s]), this.size = ++o.size, this;
      o = this.__data__ = new r(u);
    }
    return o.set(i, s), this.size = o.size, this;
  }
  return Me = n, Me;
}
var Pe, wt;
function On() {
  if (wt) return Pe;
  wt = 1;
  var a = k(), e = Za(), r = Qa(), t = en(), n = rn(), i = Cn();
  function s(o) {
    var u = this.__data__ = new a(o);
    this.size = u.size;
  }
  return s.prototype.clear = e, s.prototype.delete = r, s.prototype.get = t, s.prototype.has = n, s.prototype.set = i, Pe = s, Pe;
}
var Fe, jt;
function Ma() {
  if (jt) return Fe;
  jt = 1;
  var a = Mr(), e = (function() {
    try {
      var r = a(Object, "defineProperty");
      return r({}, "", {}), r;
    } catch {
    }
  })();
  return Fe = e, Fe;
}
var De, It;
function Pr() {
  if (It) return De;
  It = 1;
  var a = Ma();
  function e(r, t, n) {
    t == "__proto__" && a ? a(r, t, {
      configurable: !0,
      enumerable: !0,
      value: n,
      writable: !0
    }) : r[t] = n;
  }
  return De = e, De;
}
var Le, St;
function Pa() {
  if (St) return Le;
  St = 1;
  var a = Pr(), e = L();
  function r(t, n, i) {
    (i !== void 0 && !e(t[n], i) || i === void 0 && !(n in t)) && a(t, n, i);
  }
  return Le = r, Le;
}
var Ee, xt;
function An() {
  if (xt) return Ee;
  xt = 1;
  function a(e) {
    return function(r, t, n) {
      for (var i = -1, s = Object(r), o = n(r), u = o.length; u--; ) {
        var c = o[e ? u : ++i];
        if (t(s[c], c, s) === !1)
          break;
      }
      return r;
    };
  }
  return Ee = a, Ee;
}
var ke, Mt;
function mn() {
  if (Mt) return ke;
  Mt = 1;
  var a = An(), e = a();
  return ke = e, ke;
}
var I = { exports: {} };
I.exports;
var Pt;
function $n() {
  return Pt || (Pt = 1, (function(a, e) {
    var r = $(), t = e && !e.nodeType && e, n = t && !0 && a && !a.nodeType && a, i = n && n.exports === t, s = i ? r.Buffer : void 0, o = s ? s.allocUnsafe : void 0;
    function u(c, h) {
      if (h)
        return c.slice();
      var l = c.length, d = o ? o(l) : new c.constructor(l);
      return c.copy(d), d;
    }
    a.exports = u;
  })(I, I.exports)), I.exports;
}
var He, Ft;
function wn() {
  if (Ft) return He;
  Ft = 1;
  var a = $(), e = a.Uint8Array;
  return He = e, He;
}
var Ge, Dt;
function jn() {
  if (Dt) return Ge;
  Dt = 1;
  var a = wn();
  function e(r) {
    var t = new r.constructor(r.byteLength);
    return new a(t).set(new a(r)), t;
  }
  return Ge = e, Ge;
}
var Ue, Lt;
function In() {
  if (Lt) return Ue;
  Lt = 1;
  var a = jn();
  function e(r, t) {
    var n = t ? a(r.buffer) : r.buffer;
    return new r.constructor(n, r.byteOffset, r.length);
  }
  return Ue = e, Ue;
}
var Ne, Et;
function Sn() {
  if (Et) return Ne;
  Et = 1;
  function a(e, r) {
    var t = -1, n = e.length;
    for (r || (r = Array(n)); ++t < n; )
      r[t] = e[t];
    return r;
  }
  return Ne = a, Ne;
}
var Be, kt;
function xn() {
  if (kt) return Be;
  kt = 1;
  var a = A(), e = Object.create, r = /* @__PURE__ */ (function() {
    function t() {
    }
    return function(n) {
      if (!a(n))
        return {};
      if (e)
        return e(n);
      t.prototype = n;
      var i = new t();
      return t.prototype = void 0, i;
    };
  })();
  return Be = r, Be;
}
var ze, Ht;
function Mn() {
  if (Ht) return ze;
  Ht = 1;
  function a(e, r) {
    return function(t) {
      return e(r(t));
    };
  }
  return ze = a, ze;
}
var Ve, Gt;
function Fa() {
  if (Gt) return Ve;
  Gt = 1;
  var a = Mn(), e = a(Object.getPrototypeOf, Object);
  return Ve = e, Ve;
}
var Ke, Ut;
function Da() {
  if (Ut) return Ke;
  Ut = 1;
  var a = Object.prototype;
  function e(r) {
    var t = r && r.constructor, n = typeof t == "function" && t.prototype || a;
    return r === n;
  }
  return Ke = e, Ke;
}
var Xe, Nt;
function Pn() {
  if (Nt) return Xe;
  Nt = 1;
  var a = xn(), e = Fa(), r = Da();
  function t(n) {
    return typeof n.constructor == "function" && !r(n) ? a(e(n)) : {};
  }
  return Xe = t, Xe;
}
var Je, Bt;
function P() {
  if (Bt) return Je;
  Bt = 1;
  function a(e) {
    return e != null && typeof e == "object";
  }
  return Je = a, Je;
}
var We, zt;
function Fn() {
  if (zt) return We;
  zt = 1;
  var a = H(), e = P(), r = "[object Arguments]";
  function t(n) {
    return e(n) && a(n) == r;
  }
  return We = t, We;
}
var Ye, Vt;
function La() {
  if (Vt) return Ye;
  Vt = 1;
  var a = Fn(), e = P(), r = Object.prototype, t = r.hasOwnProperty, n = r.propertyIsEnumerable, i = a(/* @__PURE__ */ (function() {
    return arguments;
  })()) ? a : function(s) {
    return e(s) && t.call(s, "callee") && !n.call(s, "callee");
  };
  return Ye = i, Ye;
}
var Ze, Kt;
function Ea() {
  if (Kt) return Ze;
  Kt = 1;
  var a = Array.isArray;
  return Ze = a, Ze;
}
var Qe, Xt;
function ka() {
  if (Xt) return Qe;
  Xt = 1;
  var a = 9007199254740991;
  function e(r) {
    return typeof r == "number" && r > -1 && r % 1 == 0 && r <= a;
  }
  return Qe = e, Qe;
}
var er, Jt;
function Fr() {
  if (Jt) return er;
  Jt = 1;
  var a = xr(), e = ka();
  function r(t) {
    return t != null && e(t.length) && !a(t);
  }
  return er = r, er;
}
var rr, Wt;
function Dn() {
  if (Wt) return rr;
  Wt = 1;
  var a = Fr(), e = P();
  function r(t) {
    return e(t) && a(t);
  }
  return rr = r, rr;
}
var S = { exports: {} }, tr, Yt;
function Ln() {
  if (Yt) return tr;
  Yt = 1;
  function a() {
    return !1;
  }
  return tr = a, tr;
}
S.exports;
var Zt;
function Ha() {
  return Zt || (Zt = 1, (function(a, e) {
    var r = $(), t = Ln(), n = e && !e.nodeType && e, i = n && !0 && a && !a.nodeType && a, s = i && i.exports === n, o = s ? r.Buffer : void 0, u = o ? o.isBuffer : void 0, c = u || t;
    a.exports = c;
  })(S, S.exports)), S.exports;
}
var ar, Qt;
function En() {
  if (Qt) return ar;
  Qt = 1;
  var a = H(), e = Fa(), r = P(), t = "[object Object]", n = Function.prototype, i = Object.prototype, s = n.toString, o = i.hasOwnProperty, u = s.call(Object);
  function c(h) {
    if (!r(h) || a(h) != t)
      return !1;
    var l = e(h);
    if (l === null)
      return !0;
    var d = o.call(l, "constructor") && l.constructor;
    return typeof d == "function" && d instanceof d && s.call(d) == u;
  }
  return ar = c, ar;
}
var nr, ea;
function kn() {
  if (ea) return nr;
  ea = 1;
  var a = H(), e = ka(), r = P(), t = "[object Arguments]", n = "[object Array]", i = "[object Boolean]", s = "[object Date]", o = "[object Error]", u = "[object Function]", c = "[object Map]", h = "[object Number]", l = "[object Object]", d = "[object RegExp]", _ = "[object Set]", b = "[object String]", q = "[object WeakMap]", T = "[object ArrayBuffer]", m = "[object DataView]", p = "[object Float32Array]", N = "[object Float64Array]", B = "[object Int8Array]", w = "[object Int16Array]", C = "[object Int32Array]", y = "[object Uint8Array]", v = "[object Uint8ClampedArray]", F = "[object Uint16Array]", g = "[object Uint32Array]", f = {};
  f[p] = f[N] = f[B] = f[w] = f[C] = f[y] = f[v] = f[F] = f[g] = !0, f[t] = f[n] = f[T] = f[i] = f[m] = f[s] = f[o] = f[u] = f[c] = f[h] = f[l] = f[d] = f[_] = f[b] = f[q] = !1;
  function j(O) {
    return r(O) && e(O.length) && !!f[a(O)];
  }
  return nr = j, nr;
}
var ir, ra;
function Hn() {
  if (ra) return ir;
  ra = 1;
  function a(e) {
    return function(r) {
      return e(r);
    };
  }
  return ir = a, ir;
}
var x = { exports: {} };
x.exports;
var ta;
function Gn() {
  return ta || (ta = 1, (function(a, e) {
    var r = Ia(), t = e && !e.nodeType && e, n = t && !0 && a && !a.nodeType && a, i = n && n.exports === t, s = i && r.process, o = (function() {
      try {
        var u = n && n.require && n.require("util").types;
        return u || s && s.binding && s.binding("util");
      } catch {
      }
    })();
    a.exports = o;
  })(x, x.exports)), x.exports;
}
var sr, aa;
function Ga() {
  if (aa) return sr;
  aa = 1;
  var a = kn(), e = Hn(), r = Gn(), t = r && r.isTypedArray, n = t ? e(t) : a;
  return sr = n, sr;
}
var or, na;
function Ua() {
  if (na) return or;
  na = 1;
  function a(e, r) {
    if (!(r === "constructor" && typeof e[r] == "function") && r != "__proto__")
      return e[r];
  }
  return or = a, or;
}
var ur, ia;
function Un() {
  if (ia) return ur;
  ia = 1;
  var a = Pr(), e = L(), r = Object.prototype, t = r.hasOwnProperty;
  function n(i, s, o) {
    var u = i[s];
    (!(t.call(i, s) && e(u, o)) || o === void 0 && !(s in i)) && a(i, s, o);
  }
  return ur = n, ur;
}
var cr, sa;
function Nn() {
  if (sa) return cr;
  sa = 1;
  var a = Un(), e = Pr();
  function r(t, n, i, s) {
    var o = !i;
    i || (i = {});
    for (var u = -1, c = n.length; ++u < c; ) {
      var h = n[u], l = s ? s(i[h], t[h], h, i, t) : void 0;
      l === void 0 && (l = t[h]), o ? e(i, h, l) : a(i, h, l);
    }
    return i;
  }
  return cr = r, cr;
}
var hr, oa;
function Bn() {
  if (oa) return hr;
  oa = 1;
  function a(e, r) {
    for (var t = -1, n = Array(e); ++t < e; )
      n[t] = r(t);
    return n;
  }
  return hr = a, hr;
}
var fr, ua;
function Na() {
  if (ua) return fr;
  ua = 1;
  var a = 9007199254740991, e = /^(?:0|[1-9]\d*)$/;
  function r(t, n) {
    var i = typeof t;
    return n = n ?? a, !!n && (i == "number" || i != "symbol" && e.test(t)) && t > -1 && t % 1 == 0 && t < n;
  }
  return fr = r, fr;
}
var lr, ca;
function zn() {
  if (ca) return lr;
  ca = 1;
  var a = Bn(), e = La(), r = Ea(), t = Ha(), n = Na(), i = Ga(), s = Object.prototype, o = s.hasOwnProperty;
  function u(c, h) {
    var l = r(c), d = !l && e(c), _ = !l && !d && t(c), b = !l && !d && !_ && i(c), q = l || d || _ || b, T = q ? a(c.length, String) : [], m = T.length;
    for (var p in c)
      (h || o.call(c, p)) && !(q && // Safari 9 has enumerable `arguments.length` in strict mode.
      (p == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      _ && (p == "offset" || p == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      b && (p == "buffer" || p == "byteLength" || p == "byteOffset") || // Skip index properties.
      n(p, m))) && T.push(p);
    return T;
  }
  return lr = u, lr;
}
var dr, ha;
function Vn() {
  if (ha) return dr;
  ha = 1;
  function a(e) {
    var r = [];
    if (e != null)
      for (var t in Object(e))
        r.push(t);
    return r;
  }
  return dr = a, dr;
}
var pr, fa;
function Kn() {
  if (fa) return pr;
  fa = 1;
  var a = A(), e = Da(), r = Vn(), t = Object.prototype, n = t.hasOwnProperty;
  function i(s) {
    if (!a(s))
      return r(s);
    var o = e(s), u = [];
    for (var c in s)
      c == "constructor" && (o || !n.call(s, c)) || u.push(c);
    return u;
  }
  return pr = i, pr;
}
var vr, la;
function Ba() {
  if (la) return vr;
  la = 1;
  var a = zn(), e = Kn(), r = Fr();
  function t(n) {
    return r(n) ? a(n, !0) : e(n);
  }
  return vr = t, vr;
}
var gr, da;
function Xn() {
  if (da) return gr;
  da = 1;
  var a = Nn(), e = Ba();
  function r(t) {
    return a(t, e(t));
  }
  return gr = r, gr;
}
var _r, pa;
function Jn() {
  if (pa) return _r;
  pa = 1;
  var a = Pa(), e = $n(), r = In(), t = Sn(), n = Pn(), i = La(), s = Ea(), o = Dn(), u = Ha(), c = xr(), h = A(), l = En(), d = Ga(), _ = Ua(), b = Xn();
  function q(T, m, p, N, B, w, C) {
    var y = _(T, p), v = _(m, p), F = C.get(v);
    if (F) {
      a(T, p, F);
      return;
    }
    var g = w ? w(y, v, p + "", T, m, C) : void 0, f = g === void 0;
    if (f) {
      var j = s(v), O = !j && u(v), Dr = !j && !O && d(v);
      g = v, j || O || Dr ? s(y) ? g = y : o(y) ? g = t(y) : O ? (f = !1, g = e(v, !0)) : Dr ? (f = !1, g = r(v, !0)) : g = [] : l(v) || i(v) ? (g = y, i(y) ? g = b(y) : (!h(y) || c(y)) && (g = n(v))) : f = !1;
    }
    f && (C.set(v, g), B(g, v, N, w, C), C.delete(v)), a(T, p, g);
  }
  return _r = q, _r;
}
var yr, va;
function Wn() {
  if (va) return yr;
  va = 1;
  var a = On(), e = Pa(), r = mn(), t = Jn(), n = A(), i = Ba(), s = Ua();
  function o(u, c, h, l, d) {
    u !== c && r(c, function(_, b) {
      if (d || (d = new a()), n(_))
        t(u, c, b, h, o, l, d);
      else {
        var q = l ? l(s(u, b), _, b + "", u, c, d) : void 0;
        q === void 0 && (q = _), e(u, b, q);
      }
    }, i);
  }
  return yr = o, yr;
}
var br, ga;
function za() {
  if (ga) return br;
  ga = 1;
  function a(e) {
    return e;
  }
  return br = a, br;
}
var qr, _a;
function Yn() {
  if (_a) return qr;
  _a = 1;
  function a(e, r, t) {
    switch (t.length) {
      case 0:
        return e.call(r);
      case 1:
        return e.call(r, t[0]);
      case 2:
        return e.call(r, t[0], t[1]);
      case 3:
        return e.call(r, t[0], t[1], t[2]);
    }
    return e.apply(r, t);
  }
  return qr = a, qr;
}
var Tr, ya;
function Zn() {
  if (ya) return Tr;
  ya = 1;
  var a = Yn(), e = Math.max;
  function r(t, n, i) {
    return n = e(n === void 0 ? t.length - 1 : n, 0), function() {
      for (var s = arguments, o = -1, u = e(s.length - n, 0), c = Array(u); ++o < u; )
        c[o] = s[n + o];
      o = -1;
      for (var h = Array(n + 1); ++o < n; )
        h[o] = s[o];
      return h[n] = i(c), a(t, this, h);
    };
  }
  return Tr = r, Tr;
}
var Rr, ba;
function Qn() {
  if (ba) return Rr;
  ba = 1;
  function a(e) {
    return function() {
      return e;
    };
  }
  return Rr = a, Rr;
}
var Cr, qa;
function ei() {
  if (qa) return Cr;
  qa = 1;
  var a = Qn(), e = Ma(), r = za(), t = e ? function(n, i) {
    return e(n, "toString", {
      configurable: !0,
      enumerable: !1,
      value: a(i),
      writable: !0
    });
  } : r;
  return Cr = t, Cr;
}
var Or, Ta;
function ri() {
  if (Ta) return Or;
  Ta = 1;
  var a = 800, e = 16, r = Date.now;
  function t(n) {
    var i = 0, s = 0;
    return function() {
      var o = r(), u = e - (o - s);
      if (s = o, u > 0) {
        if (++i >= a)
          return arguments[0];
      } else
        i = 0;
      return n.apply(void 0, arguments);
    };
  }
  return Or = t, Or;
}
var Ar, Ra;
function ti() {
  if (Ra) return Ar;
  Ra = 1;
  var a = ei(), e = ri(), r = e(a);
  return Ar = r, Ar;
}
var mr, Ca;
function ai() {
  if (Ca) return mr;
  Ca = 1;
  var a = za(), e = Zn(), r = ti();
  function t(n, i) {
    return r(e(n, i, a), n + "");
  }
  return mr = t, mr;
}
var $r, Oa;
function ni() {
  if (Oa) return $r;
  Oa = 1;
  var a = L(), e = Fr(), r = Na(), t = A();
  function n(i, s, o) {
    if (!t(o))
      return !1;
    var u = typeof s;
    return (u == "number" ? e(o) && r(s, o.length) : u == "string" && s in o) ? a(o[s], i) : !1;
  }
  return $r = n, $r;
}
var wr, Aa;
function ii() {
  if (Aa) return wr;
  Aa = 1;
  var a = ai(), e = ni();
  function r(t) {
    return a(function(n, i) {
      var s = -1, o = i.length, u = o > 1 ? i[o - 1] : void 0, c = o > 2 ? i[2] : void 0;
      for (u = t.length > 3 && typeof u == "function" ? (o--, u) : void 0, c && e(i[0], i[1], c) && (u = o < 3 ? void 0 : u, o = 1), n = Object(n); ++s < o; ) {
        var h = i[s];
        h && t(n, h, s, u);
      }
      return n;
    });
  }
  return wr = r, wr;
}
var jr, ma;
function si() {
  if (ma) return jr;
  ma = 1;
  var a = Wn(), e = ii(), r = e(function(t, n, i) {
    a(t, n, i);
  });
  return jr = r, jr;
}
var oi = si();
const $a = /* @__PURE__ */ Va(oi);
class Ir extends Error {
  data;
  constructor(e, r) {
    super(e), this.name = "RequestError", this.data = r;
  }
}
const R = (a) => a instanceof Ir;
class M {
  credentials;
  agent;
  constructor(e, r) {
    this.credentials = e, this.agent = r;
  }
  async get(e, r) {
    try {
      return await Lr.get(
        e,
        $a(
          { ...r },
          {
            httpsAgent: this.agent,
            headers: this.credentials.authorizationHeaders
          }
        )
      );
    } catch (t) {
      throw new Ir(
        t instanceof Error ? t.message : String(t),
        Er(t) && t.response ? t.response.data : void 0
      );
    }
  }
  async post(e, r, t) {
    try {
      return await Lr.post(
        e,
        r,
        $a(
          { ...t },
          {
            httpsAgent: this.agent,
            headers: this.credentials.authorizationHeaders
          }
        )
      );
    } catch (n) {
      throw new Ir(
        n instanceof Error ? n.message : String(n),
        Er(n) && n.response ? n.response.data : void 0
      );
    }
  }
}
class Sr {
  get authorizationHeaders() {
    return {};
  }
}
class ui {
  requestId;
  identifier;
  constructor({
    requestId: e,
    identifier: r
  }) {
    this.requestId = e, this.identifier = r;
  }
  get authorizationHeaders() {
    return {
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      "X-FM-Data-OAuth-Request-Id": this.requestId,
      "X-FM-Data-OAuth-Identifier": this.identifier
    };
  }
}
class ci {
  username;
  password;
  constructor({ username: e, password: r }) {
    this.username = e, this.password = r;
  }
  get authorizationHeaders() {
    return {
      Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`
    };
  }
}
class gi {
  authorization;
  constructor(e) {
    this.authorization = e;
  }
  get authorizationHeaders() {
    return {
      Authorization: this.authorization
    };
  }
}
class _i {
  server;
  database;
  request;
  constructor({ server: e, database: r }) {
    this.server = e, this.database = r, this.request = new M(new Sr());
  }
  url(e) {
    return `https://${this.server}/fmi/data/vLatest/databases/${this.database}/${e}`;
  }
  async getAuthType() {
    const r = (await this.request.get(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )).data.data;
    return r !== void 0 ? r.Provider[0].Name : "basic";
  }
  async getOAuthUrl({
    trackingId: e,
    provider: r,
    returnUrl: t
  }) {
    const n = `https://${this.server}/oauth/getoauthurl?trackingID=${e}&provider=${r}&address=${this.server}&X-FMS-OAuth-AuthType=2`;
    console.log(n), console.log({
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": t ?? `https://${this.server}/oauth-handler`
      }
    });
    const i = await this.request.get(n, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": t ?? `https://${this.server}/oauth-handler`
      }
    }), s = i.data, o = i.headers["x-fms-request-id"] ?? "";
    if (o === void 0 || o === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: s, requestId: o };
  }
  // Uses a requestId and an identifier (OAuth) to return an authentication
  // token which can be used for subsequent requests.
  async getTokenUsingOAuth({
    requestId: e,
    identifier: r
  }) {
    return (await this.request.post(this.url("sessions"), {
      headers: {
        "Content-Type": "application/json",
        "X-FM-Data-OAuth-Request-Id": e,
        "X-FM-Data-OAuth-Identifier": r
      }
    })).headers["X-FM-Data-Access-Token"];
  }
  /**
   * Uses the given credentials to return an authentication token which can be
  /* used for subsequent requests.
   */
  async getTokenUsingCredentials({
    username: e,
    password: r
  }) {
    return (await this.request.post(
      this.url("sessions"),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${e}:${r}`)}`
        }
      }
    )).data.response.token ?? null;
  }
}
class hi {
  config;
  table;
  record;
  constructor({
    config: e,
    table: r,
    record: t
  }) {
    this.config = e, this.table = r, this.record = t;
  }
  toRequestBody({
    boundary: e,
    changeId: r
  }) {
    const { ID: t, ...n } = this.record, i = JSON.stringify(n);
    return `--${e}\r
Content-Type: application/http\r
Content-ID: ${r}\r
\r
PATCH ${this.url(this.table)}('${this.record.ID}') HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(i)}\r
\r
` + i + `\r
`;
  }
  parseResponse(e) {
    const r = /HTTP\/1.1\s+(\d+)\s/.exec(e);
    if (r === null) throw new Error("Could not find status in response");
    const t = Number(r[1]);
    if (t >= 300) {
      const { error: i } = JSON.parse(
        e.substring(e.indexOf("{")).trim()
      );
      throw new Error(`[UPDATE OPERATION: ${this.table}] ${i.message}`);
    }
    const n = JSON.parse(e.substring(e.indexOf("{")).trim());
    return { status: t, body: n };
  }
  url(e) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${e}`;
  }
  byteLength(e) {
    return new TextEncoder().encode(e).byteLength;
  }
}
class fi {
  config;
  table;
  record;
  constructor({
    config: e,
    table: r,
    record: t
  }) {
    this.config = e, this.table = r, this.record = t;
  }
  toRequestBody({
    boundary: e,
    changeId: r
  }) {
    const t = JSON.stringify(this.record);
    return `--${e}\r
Content-Type: application/http\r
Content-ID: ${r}\r
\r
POST ${this.url(this.table)} HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(t)}\r
\r
` + t + `\r
`;
  }
  parseResponse(e) {
    const r = /HTTP\/1.1\s+(\d+)\s/.exec(e);
    if (r === null) throw new Error("Could not find status in response");
    const t = Number(r[1]);
    if (t >= 300) {
      const { error: n } = JSON.parse(
        e.substring(e.indexOf("{")).trim()
      );
      throw new Error(`[CREATE OPERATION: ${this.table}] ${n.message}`);
    }
    return { status: t, body: null };
  }
  url(e) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${e}`;
  }
  byteLength(e) {
    return new TextEncoder().encode(e).byteLength;
  }
}
class li {
  config;
  table;
  id;
  constructor({
    config: e,
    table: r,
    id: t
  }) {
    this.config = e, this.table = r, this.id = t;
  }
  toRequestBody({
    boundary: e,
    changeId: r
  }) {
    return `--${e}\r
Content-Type: application/http\r
Content-ID: ${r}\r
\r
DELETE ${this.url(this.table)}('${this.id}') HTTP/1.1\r
\r
\r
`;
  }
  parseResponse(e) {
    const r = /HTTP\/1.1\s+(\d+)\s/.exec(e);
    if (r === null) throw new Error("Could not find status in response");
    const t = Number(r[1]);
    if (t >= 300) {
      const { error: n } = JSON.parse(
        e.substring(e.indexOf("{")).trim()
      );
      throw new Error(`[DELETE OPERATION: ${this.table}] ${n.message}`);
    }
    return { status: t, body: null };
  }
  url(e) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${e}`;
  }
}
class di {
  operations;
  callback;
  config;
  constructor(e, r) {
    this.config = e, this.callback = r, this.operations = [];
  }
  update({
    table: e,
    record: r
  }) {
    return this.operations.push(
      new hi({
        config: this.config,
        table: e,
        record: r
      })
    ), this;
  }
  create({ table: e, record: r }) {
    return this.operations.push(
      new fi({
        config: this.config,
        table: e,
        record: r
      })
    ), this;
  }
  delete({ table: e, id: r }) {
    return this.operations.push(
      new li({
        config: this.config,
        table: e,
        id: r
      })
    ), this;
  }
  execute() {
    return this.callback(this.operations);
  }
}
const wa = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (a) => {
  const e = Math.random() * 16 | 0;
  return (a == "x" ? e : e & 3 | 8).toString(16);
});
class ja {
  config;
  logger;
  request;
  constructor({
    server: e,
    database: r,
    logger: t,
    request: n
  }) {
    this.config = { server: e, database: r }, this.logger = t, this.request = n;
  }
  url(e) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${e}`;
  }
  async metadata() {
    return (await this.request.get(this.url("$metadata"))).data;
  }
  async subquery(e) {
    this.log(`[FileMaker] Get records from ${e.table}`), this.log("Options:"), this.log(e.options), this.log(
      `URL: ${this.url(`${e.table}('${e.recordId}')/${e.path}`)}?${this.parameterize(e.options)}`
    );
    try {
      return (await this.request.get(
        `${this.url(`${e.table}('${e.recordId}')/${e.path}`)}?${this.parameterize(e.options)}`
      )).data.value;
    } catch (r) {
      throw R(r) && (this.log("[FileMaker] subquery: HTTP error"), this.log(r.data)), r;
    }
  }
  async getRecords(e, r) {
    this.log(`[FileMaker] Get records from ${e}`), this.log("Options:"), this.log(r), this.log(`URL: ${this.url(e)}?${this.parameterize(r)}`);
    try {
      return (await this.request.get(`${this.url(e)}?${this.parameterize(r)}`)).data.value;
    } catch (t) {
      throw R(t) && (this.log("[FileMaker] getRecords: HTTP error"), this.log(t.data)), t;
    }
  }
  async getRecordsWithCount(e, r) {
    this.log(`[FileMaker] Get records with count from ${e}`), this.log("Options:"), this.log(r);
    const t = { ...r, $count: !0 };
    this.log(`URL: ${this.url(e)}?${this.parameterize(t)}`);
    try {
      const n = await this.request.get(`${this.url(e)}?${this.parameterize(t)}`);
      return {
        data: n.data.value,
        count: n.data["@odata.count"] ?? 0
      };
    } catch (n) {
      throw R(n) && (this.log("[FileMaker] getRecordsWithCount: HTTP error"), this.log(n.data)), n;
    }
  }
  async getRecord(e, r, t) {
    this.log(`[FileMaker] Get record from ${e}`), this.log(`ID: ${r}`), console.log(t);
    try {
      const n = `${this.url(e)}('${encodeURIComponent(r)}')`;
      return this.log(`URL: ${n}`), (await this.request.get(n)).data;
    } catch (n) {
      throw R(n) && (this.log("[FileMaker] getRecord: HTTP error"), this.log(n.data)), n;
    }
  }
  async getValue(e, r, t) {
    try {
      return (await this.request.get(
        `${this.url(e)}('${encodeURIComponent(r)}')/${encodeURIComponent(t)}/$value`,
        {
          responseType: "arraybuffer"
        }
      )).data;
    } catch (n) {
      throw R(n) && (this.log("[FileMaker] getValue: HTTP error"), this.log(n.data)), n;
    }
  }
  async crossjoin({
    tables: e,
    options: r
  }) {
    try {
      return (await this.request.get(
        `${this.url("$crossjoin")}(${e.join(",")})?${this.parameterize(r)}`
      )).data;
    } catch (t) {
      throw R(t) && (this.log("[FileMaker] crossjoin: HTTP error"), this.log(t.data)), t;
    }
  }
  // Performs a "$batch" request, executing the given operations
  // transactionally. Meaning operations either all succeed, or none of them
  // does.
  //
  // Usage:
  //
  //   const response = (await fm
  //     .batch()
  //     .update<FindingRecord>({
  //       table: "FINDING",
  //       record: {
  //         ID: "FINDING-280DC895-23F6-4368-BE3B-3EA81D360F62",
  //         FINDING: "Example 1 2 3",
  //       },
  //     })
  //     .create<FindingRecord>({
  //       table: "FINDING",
  //       record: {
  //         FINDING: "Example body",
  //       },
  //     })
  //     .delete({
  //       table: "FINDING",
  //       id: "SOME-FINDING-ID",
  //     })
  //     .execute()) as [
  //       BatchOperationResponse<FindingRecord>,
  //       BatchOperationResponse<null>,
  //       BatchOperationResponse<null>
  //     ];
  //
  batch() {
    return new di(this.config, async (e) => {
      const r = `batch_${wa()}`, t = `changeset_${wa()}`, n = `--${r}\r
Content-Type: multipart/mixed; boundary=${t}\r
\r
` + e.map(
        (i, s) => i.toRequestBody({
          boundary: t,
          changeId: s + 1
        })
      ).join("") + `--${t}--\r
--${r}--\r
`;
      try {
        const i = await this.request.post(
          this.url("$batch"),
          n,
          {
            headers: {
              "Content-Type": `multipart/mixed; boundary=${r}`
            }
          }
        ), s = /boundary=(.+?)\r\n/.exec(i.data);
        if (s === null) throw new Error("Could not find changeset");
        const o = s[0].split("=")[1].trim();
        return i.data.split(`--${o}`).slice(1, -1).map(
          (c, h) => e[h].parseResponse(c)
        );
      } catch (i) {
        throw R(i) && (this.log("[FileMaker] batch: HTTP error"), this.log(i.data)), i;
      }
    });
  }
  async script(e, r) {
    this.log(`[FileMaker] Running script ${e} with parameters:`), this.log({ scriptParameterValue: r });
    try {
      const t = await this.request.post(
        this.url(`Script.${encodeURIComponent(e)}`),
        r === void 0 ? null : { scriptParameterValue: r },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      this.log(`[FileMaker] Script ${e} finished. Response:`), this.log(t);
      const n = t.data.scriptResult.code === 0;
      return {
        success: n,
        data: n ? t.data.scriptResult.resultParameter : void 0
      };
    } catch (t) {
      throw R(t) && (this.log("[FileMaker] script: HTTP error"), this.log(t.data)), t;
    }
  }
  parameterize(e) {
    if (e === void 0) return "$format=application/json";
    const r = {};
    if (e.$select !== void 0 && (r.$select = e.$select.map((n) => `"${String(n).replaceAll('"', '""')}"`).join(",")), e.$top !== void 0 && (r.$top = e.$top), e.$skip !== void 0 && (r.$skip = e.$skip), e.$filter !== void 0 && (r.$filter = e.$filter), e.$expand !== void 0 && (r.$expand = e.$expand), e.$orderby !== void 0) {
      const n = Array.isArray(e.$orderby[0]) ? e.$orderby : [e.$orderby];
      r.$orderby = n.map(([i, s]) => `"${String(i)}" ${s}`).join(",");
    }
    e.$count !== void 0 && (r.$count = e.$count ? "true" : "false");
    const t = e.$metadata ?? !0;
    return r.$format = `${e.$format === "xml" ? "application/xml" : "application/json"}${t ? "" : ";odata.metadata=none"}`, Object.entries(r).map(([n, i]) => `${n}=${i}`).join("&");
  }
  log(e) {
    return this.logger.log(e);
  }
}
class pi {
  log(e) {
    console.dir(e, { depth: null });
  }
}
class yi {
  log() {
  }
}
class bi {
  server;
  database;
  agent;
  logger;
  constructor({
    server: e,
    database: r,
    agent: t,
    logger: n
  }) {
    this.server = e, this.database = r, this.agent = t, this.logger = n ?? new pi();
  }
  /**
   * Creates a FileMaker instance configured with basic authentication.
   *
   * @param username - The FileMaker username
   * @param password - The FileMaker password
   * @returns A configured FileMaker instance ready to use
   */
  withBasicAuth({
    username: e,
    password: r
  }) {
    const t = new ci({ username: e, password: r }), n = new M(t, this.agent);
    return new ja({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: n
    });
  }
  /**
   * Creates a FileMaker instance configured with OAuth credentials.
   *
   * @param requestId - The request ID obtained from getOAuthUrl()
   * @param identifier - The identifier received from the OAuth redirect
   * @returns A configured FileMaker instance ready to use
   */
  withOAuth({
    requestId: e,
    identifier: r
  }) {
    const t = new ui({
      requestId: e,
      identifier: r
    }), n = new M(t, this.agent);
    return new ja({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: n
    });
  }
  /**
   * Initiates the OAuth authentication flow by generating the OAuth URL.
   * Redirect the user to the returned URL to begin authentication.
   *
   * @param trackingId - A unique identifier for tracking this OAuth request
   * @param provider - The OAuth provider name (e.g., "Google", "Microsoft")
   * @param returnUrl - Optional URL to return to after OAuth completes
   * @returns The OAuth redirect URL and request ID to store for later use
   */
  async getOAuthUrl({
    trackingId: e,
    provider: r,
    returnUrl: t
  }) {
    const n = new M(new Sr(), this.agent), i = `https://${this.server}/oauth/getoauthurl?trackingID=${e}&provider=${r}&address=${this.server}&X-FMS-OAuth-AuthType=2`, s = await n.get(i, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": t ?? `https://${this.server}/oauth-handler`
      }
    }), o = s.data, u = s.headers["x-fms-request-id"] ?? "";
    if (u === void 0 || u === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: o, requestId: u };
  }
  /**
   * Detects the available authentication types supported by the FileMaker
   * server.
   *
   * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
   */
  async getAuthTypes() {
    const t = (await new M(new Sr(), this.agent).get(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )).data.data;
    return t !== void 0 ? t.Provider.map((n) => n.Name) : ["basic"];
  }
  /**
   * Helper method to construct a FileMaker OData URL.
   *
   * @param path - The path segment to append to the base URL
   * @returns The full OData URL
   */
  url(e) {
    return `https://${this.server}/fmi/odata/v4/${this.database}/${e}`;
  }
}
export {
  ja as FileMaker,
  _i as FileMakerAuthenticator,
  ci as FileMakerBasicCredentials,
  bi as FileMakerClient,
  ui as FileMakerOAuthCredentials,
  gi as FileMakerRawCredentials,
  pi as Logger,
  Sr as NullFileMakerCredentials,
  yi as NullLogger
};
