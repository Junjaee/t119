// @CODE:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/lawyer/rating-widget.test.tsx
/**
 * RatingWidget - 평가 점수 위젯
 *
 * 변호사 대시보드 - 평가 점수 표시
 * - 평균 평가 점수 (별점 형식)
 * - 최근 리뷰 목록 (최대 3개)
 * - 월별 평가 추이 차트 (LineChart)
 *
 * @SPEC:DASHBOARD-001 - 변호사 대시보드
 * Ubiquitous Requirements: 시스템은 차트 및 통계 위젯을 제공해야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';

export interface Review {
  id: string;
  rating: number;
  comment: string;
  date: string;
}

export interface RatingData {
  avgRating: number;
  reviewCount: number;
  recentReviews: Review[];
  monthlyData: Array<{
    month: string;
    rating: number;
  }>;
}

export interface RatingWidgetProps {
  data?: RatingData;
  isLoading?: boolean;
}

/**
 * RatingWidget 컴포넌트
 */
export function RatingWidget({ data, isLoading }: RatingWidgetProps) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!data) {
    return null;
  }

  const isEmpty = data.avgRating === 0 && data.reviewCount === 0;

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">평가 점수</h2>

      {isEmpty ? (
        <div className="text-center py-8 text-gray-500">
          아직 평가가 없습니다
        </div>
      ) : (
        <div className="space-y-4">
          {/* 평균 평가 */}
          <StatsCard
            title="평균 평가"
            value={data.avgRating}
            variant="success"
          />

          {/* 최근 리뷰 */}
          {data.recentReviews.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">최근 리뷰</h3>
              <ul className="space-y-2">
                {data.recentReviews.slice(0, 3).map((review) => (
                  <li
                    key={review.id}
                    className="p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">★ {review.rating}</span>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 월별 평가 추이 차트 */}
          {data.monthlyData.length > 0 && (
            <ChartWidget title="월별 평가 추이">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartWidget>
          )}
        </div>
      )}
    </Card>
  );
}
