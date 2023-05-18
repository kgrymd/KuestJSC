function smoothScrollTo(element) {
    $('html, body').animate({
        scrollTop: $(element).offset().top
    }, 3000);
}




// 1日に必要なカロリーとマクロ栄養素を計算する関数
function calculateNutrients(height, weight, age, gender, activityLevel) {
    let bmr;//BMRとはBasal Metabolic Rateの略で、日本語で言う基礎代謝率
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const dailyCalories = bmr * activityLevel;
    const dailyProtein = weight * 1.5; //2倍と書いてる書籍もある(筋トレとかする人は2倍とかだった気がする)
    const dailyFat = dailyCalories * 0.25 / 9;
    const dailyCarbs = (dailyCalories - dailyProtein * 4 - dailyFat * 9) / 4;


    return {
        calories: dailyCalories,
        protein: dailyProtein,
        fat: dailyFat,
        carbs: dailyCarbs,
    };
}

//もともとはcaluclateDailyIntakeという名前。1/3して一色あたりに変換する関数
function calculateOneIntake(activityLevel) {
    return {
        calories: activityLevel.calories / 3,
        protein: activityLevel.protein / 3,
        fat: activityLevel.fat / 3,
        carbs: activityLevel.carbs / 3,
    };
}
//1日の摂取量からその日すでに摂取している量を引いたやつを作るための関数
function subtractNutrients(obj1, obj2) {
    return {
        calories: obj1.calories - obj2.calories,
        protein: obj1.protein - obj2.protein,
        fat: obj1.fat - obj2.fat,
        carbs: obj1.carbs - obj2.carbs
    };
}

//1食の推奨摂取量を計算する関数 (r - a) / (n - c)
function oneIntake(howManyMeals, recommendedDailyIntake, actualIntake, eatCount) {
    return {
        calories: (recommendedDailyIntake.calories - actualIntake.calories) / (howManyMeals - eatCount),
        protein: (recommendedDailyIntake.protein - actualIntake.protein) / (howManyMeals - eatCount),
        fat: (recommendedDailyIntake.fat - actualIntake.fat) / (howManyMeals - eatCount),
        carbs: (recommendedDailyIntake.carbs - actualIntake.carbs) / (howManyMeals - eatCount)
    }
}



//商品を取り出す関数
async function fetchProducts() {
    const snapshot = await db.collection('products').get();
    const products = [];
    snapshot.forEach(doc => products.push({ id: doc.id, data: doc.data() }));
    return products;
}


// function findBestProductCombination(userNutrients, allCombinations) {
//     let minDifference = Infinity;
//     let bestCombination = [];


//     for (let combination of allCombinations) {
//         const combinedNutrients = getCombinedNutrients(combination);

//         const difference =
//             Math.abs(userNutrients.calories - combinedNutrients.calories) +
//             Math.abs(userNutrients.protein - combinedNutrients.protein) +
//             Math.abs(userNutrients.fat - combinedNutrients.fat) +
//             Math.abs(userNutrients.carbs - combinedNutrients.carbs);

//         if (difference < minDifference) {
//             minDifference = difference;
//             bestCombination = combination;
//         }
//     }

//     return bestCombination;
// }

//↑を上位n組み合わせを作るように変更したやつが↓

function findBestProductCombinations(userNutrients, allCombinations, count) {
    const bestCombinations = [];
    const combinationDifferences = [];

    for (let combination of allCombinations) {
        const combinedNutrients = getCombinedNutrients(combination);

        const difference =
            Math.abs(userNutrients.calories - combinedNutrients.calories) +
            Math.abs(userNutrients.protein - combinedNutrients.protein) +
            Math.abs(userNutrients.fat - combinedNutrients.fat) +
            Math.abs(userNutrients.carbs - combinedNutrients.carbs);

        combinationDifferences.push({ combination, difference });
    }

    combinationDifferences.sort((a, b) => a.difference - b.difference);

    for (let i = 0; i < count && i < combinationDifferences.length; i++) {
        bestCombinations.push(combinationDifferences[i].combination);
    }

    return bestCombinations;
}


function getAllCombinationsOfSize(arr, size) {
    const results = [];

    const helper = (input, current, n) => {
        if (current.length === n) {
            results.push(current);
            return;
        }

        if (input.length === 0) {
            return;
        }

        helper(input.slice(1), current.concat(input[0]), n);
        helper(input.slice(1), current, n);
    };

    helper(arr, [], size);
    return results;
}


function getCombinedNutrients(combination) {
    return combination.reduce((acc, product) => {
        return {
            calories: acc.calories + product.data.calories,
            protein: acc.protein + product.data.protein,
            fat: acc.fat + product.data.fat,
            carbs: acc.carbs + product.data.carbs,
        };
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
}


async function getTotalNutrients(userId, ...date) {
    const userRef = db.collection("users").doc(userId);
    const intakeHistoryRef = userRef.collection("intakeHistory");
    const dateRef = intakeHistoryRef.doc(date);

    const doc = await dateRef.get();
    if (doc.exists) {
        const data = doc.data();

        const combinedNutrientsArray = Object.values(data).map(item => item.data);



        console.log("combinedNutrientsArray:", combinedNutrientsArray);

        const totalNutrients = getCombinedNutrients(combinedNutrientsArray);
        return totalNutrients;
    } else {
        console.error("No document found for the specified date");
        return null;
    }
}




// ユーザーIDから身長、体重、年齢、性別の情報を取得する関数
async function fetchUserDetails(userId) {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        alert('ユーザーが存在しません。正しいユーザーIDを入力してください。');
        return null;
    }
    height = userDoc.data().height;
    weight = userDoc.data().weight;
    age = userDoc.data().age;
    gender = userDoc.data().gender;
    eatCount = userDoc.data().eatCount || 0; // 追加


    return userDoc.data();
}

// ユーザーIDに紐づいたユーザーデータを更新する関数
async function updateUserData(userId, updatedData) {
    const userRef = db.collection('users').doc(userId);
    await userRef.update(updatedData);
    alert("データが保存されました。");
}


// 選ばれた組み合わせの合計金額を計算する関数。 
function getTotalCost(combination) {
    const totalCost = combination.reduce((acc, product) => {
        return acc + product.data.price;
    }, 0);

    return totalCost;
}

// 予算に基づいてフィルタリングする関数
function filterCombinationsByBudget(combinations, budget) {
    return combinations.filter(combination => {
        const totalCost = getTotalCost(combination);
        return totalCost <= budget;
    });
}

// //カテゴリに基づいてフィルタリングする関数
// function filterProductsByCategory(products, category) {
//     if (!category) {
//         return products;
//     }
//     return products.filter((product) => product.data.category === category);
// }

// カテゴリに基づいてフィルタリングする関数(複数選択対応版)
function filterProductsByCategories(products, categories) {
    if (!categories || categories.length === 0) {
        return products;
    }
    return products.filter((product) => categories.includes(product.data.category));
}
//ユーザーが選択したカテゴリ(オプション)を取得する関数
function getSelectedCategories() {
    return $("#categories option:selected").map(function () {
        return this.value;
    }).get();
}




async function fetchIntakeData(userId) {
    const intakeRef = db.collection('users').doc(userId).collection('intakes').doc('dailyIntake');
    const intakeDoc = await intakeRef.get();

    if (!intakeDoc.exists) {
        actualIntake = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
        };
        await intakeRef.set({
            recommendedDailyIntake: recommendedDailyIntake,
            newrecommendedDailyIntake: newrecommendedDailyIntake,
            actualIntake: actualIntake,
        });
    } else {
        actualIntake = intakeDoc.data().actualIntake;
        recommendedDailyIntake = intakeDoc.data().recommendedDailyIntake;
        newrecommendedDailyIntake = intakeDoc.data().newrecommendedDailyIntake;
    }

    return {
        recommendedDailyIntake: recommendedDailyIntake,
        newrecommendedDailyIntake: newrecommendedDailyIntake,
        actualIntake: actualIntake,
    };
}

// ユーザーIDに紐づいた摂取データを更新する関数
async function updateIntakeData(userId, updatedData) {
    // 変更: users コレクションのドキュメント内の intakes コレクションを参照
    const intakeRef = db.collection('users').doc(userId).collection('intakes').doc('dailyIntake');
    const intakeDoc = await intakeRef.get();

    if (!intakeDoc.exists) {
        // ドキュメントが存在しない場合、新しいドキュメントを作成
        await intakeRef.set(updatedData);
    } else {
        // ドキュメントが存在する場合、ドキュメントを更新
        await intakeRef.update(updatedData);
    }
    alert("データが保存されました。"); // 保存完了のアラートを追加
}

//その日の推奨量と実際の摂取量を履歴として保存する関数
async function saveDailyHistory(userId, actualIntake, recommendedDailyIntake) {
    const historyRef = db.collection('users').doc(userId).collection('intakes');
    const now = new Date()
    const jpNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const dateString = jpNow.toISOString().slice(0, 10);

    await historyRef.doc(dateString).set({
        date: now,
        actualIntake: actualIntake,
        recommendedDailyIntake: recommendedDailyIntake,
    });
}

// おすすめ商品の組み合わせを一時的に保存するための関数
function saveRecommendedProducts(userId, recommendedProducts) {
    const userRef = db.collection("users").doc(userId);
    const intakesRef = userRef.collection("intakes");

    intakesRef.doc("recommendedProducts").get().then((docSnapshot) => {
        if (docSnapshot.exists) {
            intakesRef.doc("recommendedProducts").set({ recommendedProducts });
        } else {
            intakesRef.doc("recommendedProducts").set({ recommendedProducts });
        }
    }).catch((error) => {
        console.error("Error saving recommendedProducts: ", error);
    });
}
// おすすめ商品の組み合わせを一時的に保存してるやつが存在してれば消す、してなければ何もしない関数
function deleteRecommendedProducts(userId) {
    const userRef = db.collection("users").doc(userId);
    const intakesRef = userRef.collection("intakes");

    intakesRef.doc("recommendedProducts").get().then((docSnapshot) => {
        if (docSnapshot.exists) {
            intakesRef.doc("recommendedProducts").update({
                recommendedProducts: firebase.firestore.FieldValue.delete()
            }).then(() => {
                console.log("RecommendedProducts array deleted successfully.");
            }).catch((error) => {
                console.error("Error deleting recommendedProducts array: ", error);
            });
        } else {
            console.log("RecommendedProducts document does not exist. No action needed.");
        }
    }).catch((error) => {
        console.error("Error retrieving recommendedProducts document: ", error);
    });
}

// 一時保存しているおすすめ商品の組み合わせをeatedProduct変数にセットする関数
function getRecommendedProducts(userId) {
    const userRef = db.collection("users").doc(userId);
    const intakesRef = userRef.collection("intakes");

    return intakesRef.doc("recommendedProducts").get().then((docSnapshot) => {
        if (docSnapshot.exists) {
            const recommendedProducts = docSnapshot.data().recommendedProducts;
            return recommendedProducts;
        } else {
            console.log("RecommendedProducts document does not exist.");
            return null;
        }
    }).catch((error) => {
        console.error("Error retrieving recommendedProducts: ", error);
        return null;
    });
}


// 食べたおすすめ商品を摂取履歴に保存する関数
function saveEatedProducts(userId, recommendedProducts) {
    const userRef = db.collection("users").doc(userId);
    const intakeHistoryRef = userRef.collection("intakeHistory");

    const now = new Date();
    const jpNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const year = jpNow.getFullYear();//追加
    const month = (jpNow.getMonth() + 1).toString().padStart(2, "0");//追加
    const day = jpNow.getDate().toString().padStart(2, "0");//追加
    // const currentDate = jpNow.toISOString().slice(0, 10);//元々これやった
    const currentDate = `${year}-${month}-${day}`;
    console.log('currentDate: ', currentDate);//確認用
    const currentTime = jpNow
        .toLocaleTimeString("en-US", { hour12: false, timeZone: "Asia/Tokyo" })
        .replace(/:/g, '-');

    const currentDateRef = intakeHistoryRef.doc(currentDate);

    currentDateRef.get().then((docSnapshot) => {
        if (docSnapshot.exists) {
            const updateData = {};
            updateData[currentTime] = recommendedProducts;
            currentDateRef.update(updateData);
        } else {
            const setData = {};
            setData[currentTime] = recommendedProducts;
            currentDateRef.set(setData);
        }
    }).catch((error) => {
        console.error("Error saving eatedProducts: ", error);
    });
}


// function isThisTheFirstMeal(userId) {
//     const userRef = db.collection("users").doc(userId);
//     const intakeHistoryRef = userRef.collection("intakeHistory");

//     const now = new Date();
//     const jpNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
//     const year = jpNow.getFullYear();//追加
//     const month = (jpNow.getMonth() + 1).toString().padStart(2, "0");//追加
//     const day = jpNow.getDate().toString().padStart(2, "0");//追加
//     // const currentDate = jpNow.toISOString().slice(0, 10);//元々これやった
//     const currentDate = `${year}-${month}-${day}`;
//     console.log('currentDate: ', currentDate);//確認用

//     const currentDateRef = intakeHistoryRef.doc(currentDate);

//     currentDateRef.get().then((docSnapshot) => {
//         if (docSnapshot.exists) {
//             window.location.href = "doNotEatMore.html";
//         }
//     }).catch((error) => {
//         console.error("Error saving eatedProducts: ", error);
//     });

// }

//その日一食目か調べる関数 eatCount === 0ver
function isThisTheFirstMeal0(userId) {
    const userRef = db.collection("users").doc(userId);
    const intakeHistoryRef = userRef.collection("intakeHistory");

    const now = new Date();
    const jpNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const year = jpNow.getFullYear();
    const month = (jpNow.getMonth() + 1).toString().padStart(2, "0");
    const day = jpNow.getDate().toString().padStart(2, "0");
    const currentDate = `${year}-${month}-${day}`;
    console.log('currentDate: ', currentDate);

    const currentDateRef = intakeHistoryRef.doc(currentDate);

    // Promiseを返す
    return currentDateRef.get().then((docSnapshot) => {
        if (docSnapshot.exists) {
            window.location.href = "doNotEatMore.html";
        }
    }).catch((error) => {
        console.error("Error saving eatedProducts: ", error);
    });
}

//その日一食目か調べる関数 eatCount!== 0ver
async function isThisTheFirstMealN(userId) {
    const userRef = db.collection("users").doc(userId);
    const intakeHistoryRef = userRef.collection("intakeHistory");

    const now = new Date();
    const jpNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const year = jpNow.getFullYear();
    const month = (jpNow.getMonth() + 1).toString().padStart(2, "0");
    const day = jpNow.getDate().toString().padStart(2, "0");
    const currentDate = `${year}-${month}-${day}`;
    console.log('currentDate: ', currentDate);

    const currentDateRef = intakeHistoryRef.doc(currentDate);

    // Promiseを返す
    try {
        const docSnapshot = await currentDateRef.get();  // .thenからasync/awaitに変更
        // if (docSnapshot.exists) {
        //     window.location.href = "doNotEatMore.html";
        // }
        return docSnapshot.exists; // 存在するかどうかを返す
    } catch (error) {
        console.error("Error saving eatedProducts: ", error);
        return false; // エラーが発生した場合、falseを返す
    }
}






// intakeHistory内の配列の中の配列を全部取り出して別の配列に入れる関数(その日食べた全商品のデータの配列)
async function fetchDailyIntakeData(userId, date) {

    try {
        // intakeHistoryドキュメントを取得
        const intakeHistoryDoc = await db
            .collection("users")
            .doc(userId)
            .collection("intakeHistory")
            .doc(date)
            .get();
        if (!intakeHistoryDoc.exists) {
            console.log("intakeHistoryが見つかりません！");

            return [{
                calories: 0,
                protein: 0,
                fat: 0,
                carbs: 0,
            },
            {
                calories: 0,
                protein: 0,
                fat: 0,
                carbs: 0,
            }];
        }
        console.log("IntakeHistoryデータ:", intakeHistoryDoc.data());

        // intakeHistoryデータを取得
        const intakeHistoryData = intakeHistoryDoc.data();

        // 入れ子になった配列の要素を格納する新しい配列を初期化
        const flattenedArray = [];

        // intakeHistoryデータを反復処理
        for (const key in intakeHistoryData) {
            // プロパティが配列であるかどうかを確認
            if (Array.isArray(intakeHistoryData[key])) {
                // 入れ子になった配列を反復処理
                intakeHistoryData[key].forEach((nestedArray) => {
                    // 入れ子になった要素が配列であるかどうかを確認
                    if (Array.isArray(nestedArray)) {
                        // 入れ子になった配列の要素をflattenedArrayに連結
                        flattenedArray.push(...nestedArray);
                    } else {
                        // 入れ子になった要素をflattenedArrayに追加
                        flattenedArray.push(nestedArray);
                    }
                });
            }
        }

        console.log("平坦化された配列:", flattenedArray);
        return flattenedArray;
    } catch (error) {
        console.error("ドキュメント取得時のエラー:", error);
    }
}

// その日付の配列の中の全商品のカロリーと栄養素の合計を計算しオブジェクトで返す関数(その日1回目の食事)
async function calculateTotalValues0(userId, date) {
    const dailyIntake = await fetchDailyIntakeData(userId, date);
    console.log("使用するdailyIntake:", dailyIntake);

    // 合計値を格納するオブジェクトを初期化
    const totalValues = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
    };

    // dailyIntake配列の要素を反復処理
    dailyIntake.forEach(item => {
        console.log('item:', item);
        const { calories, protein, fat, carbs } = item;

        // 各栄養素の合計値を計算
        totalValues.calories += calories;
        totalValues.protein += protein;
        totalValues.fat += fat;
        totalValues.carbs += carbs;
    });

    // 結果を表示
    console.log(totalValues);
    return totalValues;
}


// その日付の配列の中の全商品のカロリーと栄養素の合計を計算しオブジェクトで返す関数(その日２回目以降の食事)
async function calculateTotalValues(userId, date) {
    const dailyIntake = await fetchDailyIntakeData(userId, date);
    console.log("使用するdailyIntake(商品たち):", dailyIntake);

    // 合計値を格納するオブジェクトを初期化
    const totalValues = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
    };

    // dailyIntake配列の要素を反復処理
    dailyIntake.forEach(item => {
        console.log('item:', item);
        const { calories, protein, fat, carbs } = item.data; //item.data;から変えたらうまくいった。ただクエストを確認を押すのが１回目のみこの変更でOKでこのままだと２回目以降はダメという罠がありそう。

        // 各栄養素の合計値を計算
        totalValues.calories += calories;
        totalValues.protein += protein;
        totalValues.fat += fat;
        totalValues.carbs += carbs;
    });

    // 結果を表示
    console.log('摂取済み商品の合計摂取量:', totalValues);
    return totalValues;
}

// ↓は↑の関数の使い方
// (async () => {
//     await calculateTotalValues(userId, date);
// })();









// newrecommendedDailyIntake の値を更新するプレースホルダー関数
function updateNewRecommendedDailyIntake(eatCount) {
    // eatCount に基づいて newrecommendedDailyIntake の値を変更する
    if (eatCount % 3 === 0) {
        saveDailyHistory(userId, actualIntake, recommendedDailyIntake); // 追加: 履歴を保存
        userNutrients = calculateNutrients(height, weight, age, gender, activityLevel);//翌朝の食事の推奨量を計算(というてい)
        newrecommendedDailyIntake = userNutrients;
        actualIntake = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
        }
    } else if (eatCount % 3 === 1) {
        newrecommendedDailyIntake.calories = (newrecommendedDailyIntake.calories - actualIntake.calories) / 2;
        newrecommendedDailyIntake.protein = (newrecommendedDailyIntake.protein - actualIntake.protein) / 2;
        newrecommendedDailyIntake.fat = (newrecommendedDailyIntake.fat - actualIntake.fat) / 2;
        newrecommendedDailyIntake.carbs = (newrecommendedDailyIntake.carbs - actualIntake.carbs) / 2;
    } else {
        newrecommendedDailyIntake.calories = newrecommendedDailyIntake.calories - actualIntake.calories;
        newrecommendedDailyIntake.protein = newrecommendedDailyIntake.protein - actualIntake.protein;
        newrecommendedDailyIntake.fat = newrecommendedDailyIntake.fat - actualIntake.fat;
        newrecommendedDailyIntake.carbs = newrecommendedDailyIntake.carbs - actualIntake.carbs;
    }
}



// ↓レーダーチャート用の関数↓
// レーダーチャート用のデータと設定を取得して描画
async function fetchIntakeDataAndRenderRadarChart(userId, dateString) {
    console.log(dateString);

    const userRef = db.collection('users').doc(userId);

    let recommendedDailyIntake;

    try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
            recommendedDailyIntake = userDoc.data().recommendedDailyIntake;
            console.log("recommendedDailyIntake:", recommendedDailyIntake);
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error fetching recommendedDailyIntake:", error);
    }

    let actualIntake;
    (async () => {
        actualIntake = await calculateTotalValues(userId, dateString);
        console.log('レーダーチャートで利用するactualIntake:', actualIntake);
    })();

    try {
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            function normalizeIntakeData(intakeData, maxValues) {
                const normalizedData = {
                    calories: Math.min(intakeData.calories / maxValues.calories, 2),
                    protein: Math.min(intakeData.protein / maxValues.protein, 2),
                    fat: Math.min(intakeData.fat / maxValues.fat, 2),
                    carbs: Math.min(intakeData.carbs / maxValues.carbs, 2)
                };

                return normalizedData;
            }

            const normalizedRecommendedIntake = normalizeIntakeData(recommendedDailyIntake, recommendedDailyIntake);
            const normalizedActualIntake = normalizeIntakeData(actualIntake, recommendedDailyIntake);

            const radarChartData = {
                labels: ['カロリー', 'タンパク質', '脂質', '炭水化物'],
                datasets: [{
                    label: '推奨摂取量',
                    data: [
                        normalizedRecommendedIntake.calories,
                        normalizedRecommendedIntake.protein,
                        normalizedRecommendedIntake.fat,
                        normalizedRecommendedIntake.carbs
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }, {
                    label: '実際の摂取量',
                    data: [
                        normalizedActualIntake.calories,
                        normalizedActualIntake.protein,
                        normalizedActualIntake.fat,
                        normalizedActualIntake.carbs
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            };

            const radarChartOptions = {
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '推奨摂取量と実際の摂取量の比較（正規化データ）'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        }
                    }
                }
            };

            const radarChartCtx = document.getElementById('radarChart').getContext('2d');

            if (radarChart) {
                radarChart.destroy();
            }

            radarChart = new Chart(radarChartCtx, {
                type: 'radar',
                data: radarChartData,
                options: radarChartOptions
            });

        } else {
            alert('指定されたユーザーIDのデータが見つかりませんでした。');
        }
    } catch (error) {
        console.error("Error getting user document:", error);
        alert('データの取得に失敗しました。');
    }
}














// レーダーチャート用のデータと設定を取得して描画（過去の履歴版）
async function fetchIntakeDataAndRenderRadarChartR(userId, dateString) { //引数を追加。ここに外で定義して入れた日付を利用する。

    console.log(dateString);

    const userRef = db.collection('users').doc(userId);


    const intakeRef = db.collection('users').doc(userId).collection('intakes').doc(dateString);//←一旦確認ように。本当はあとでdateStringでrecommendedDailyIntake取れるようにどうにかしてやる。←した。

    let actualIntake;
    (async () => {
        actualIntake = await calculateTotalValues(userId, dateString);
        console.log(actualIntake);
    })();



    try {
        const [userDoc, intakeDoc] = await Promise.all([userRef.get(), intakeRef.get()]);
        if (userDoc.exists && intakeDoc.exists) {
            const intakeData = intakeDoc.data();

            function normalizeIntakeData(intakeData, maxValues) {
                const normalizedData = {
                    calories: Math.min(intakeData.calories / maxValues.calories, 2), // 2を上限としてクリップ
                    protein: Math.min(intakeData.protein / maxValues.protein, 2), // 2を上限としてクリップ
                    fat: Math.min(intakeData.fat / maxValues.fat, 2), // 2を上限としてクリップ
                    carbs: Math.min(intakeData.carbs / maxValues.carbs, 2) // 2を上限としてクリップ
                };

                return normalizedData;
            }

            const normalizedRecommendedIntake = normalizeIntakeData(intakeData.recommendedDailyIntake, intakeData.recommendedDailyIntake);
            const normalizedActualIntake = normalizeIntakeData(actualIntake, intakeData.recommendedDailyIntake);

            const radarChartData = {
                labels: ['カロリー', 'タンパク質', '脂質', '炭水化物'],
                datasets: [{
                    label: '推奨摂取量',
                    data: [
                        normalizedRecommendedIntake.calories,
                        normalizedRecommendedIntake.protein,
                        normalizedRecommendedIntake.fat,
                        normalizedRecommendedIntake.carbs
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }, {
                    label: '実際の摂取量',
                    data: [
                        normalizedActualIntake.calories,
                        normalizedActualIntake.protein,
                        normalizedActualIntake.fat,
                        normalizedActualIntake.carbs
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            };

            const radarChartOptions = {
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '推奨摂取量と実際の摂取量の比較（正規化データ）'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        }
                    }
                }
            };

            const radarChartCtx = document.getElementById('radarChart').getContext('2d');

            if (radarChart) {
                radarChart.destroy(); // 既存のチャートがある場合は破棄
            }

            radarChart = new Chart(radarChartCtx, {
                type: 'radar',
                data: radarChartData,
                options: radarChartOptions
            });

        } else {
            alert('指定されたユーザーIDのデータが見つかりませんでした。');
        }
    } catch (error) {
        console.error("Error getting user document:", error);
        alert('データの取得に失敗しました。');
    }
}




function generateProductHtml(product) {
    return `
        <div>
            <h3>${product.data.name}</h3>
            <img src="${product.data.image}" width="200">
            <p>カロリー: ${product.data.calories}kcal</p>
            <p>タンパク質: ${product.data.protein}g</p>
            <p>脂質: ${product.data.fat}g</p>
            <p>炭水化物: ${product.data.carbs}g</p>
            <p>値段: ¥${product.data.price}</p>
        </div>
    `;
}

function generateCombinationHtml(combination) {
    return combination.map(generateProductHtml).join('');
}
